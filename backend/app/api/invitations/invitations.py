import json
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Cookie,
    Query,
    Request,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import get_write_session, get_read_session
from app.services.s3.wallpaper import WallpaperService
from app.services.s3.slide import SlideService
from app.db.models.invitation import (
    Invitation,
    RSVP,
    Event,
    SlideshowImage,
    Game,
    Slideshow,
)
from app.schemas.invitation import (
    InvitationUpdate,
    InvitationRead,
    GameRead,
    SlideshowRead,
)
from app.services.auth import get_current_user
from http.cookies import SimpleCookie

router = APIRouter()


# -------------------- Helper to fetch invitation with ownership --------------------
async def fetch_invitation(
    invitation_id: int,
    request: Request,
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
) -> Invitation:
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        from http.cookies import SimpleCookie

        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
        )
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Ownership check
    if invitation.owner_id:
        if not current_user or invitation.owner_id != int(current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if not anon_session_id or invitation.anon_session_id != anon_session_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return invitation


# -------------------- List all games --------------------
@router.get("/games", response_model=list[GameRead])
async def list_games(db: AsyncSession = Depends(get_read_session)):
    result = await db.execute(select(Game))
    games = result.scalars().all()
    return games


@router.get("/slideshows", response_model=list[SlideshowRead])
async def list_slideshows(db: AsyncSession = Depends(get_read_session)):
    result = await db.execute(select(Slideshow))
    slideshows = result.scalars().all()
    return slideshows


# -------------------- Get Invitation --------------------
@router.get("/{invitation_id}", response_model=InvitationRead)
async def get_invitation(invitation: Invitation = Depends(fetch_invitation)):
    return invitation


# -------------------- Create Empty Invitation --------------------
@router.post("/create", response_model=InvitationRead)
async def create_empty_invitation(
    request: Request,
    db: AsyncSession = Depends(get_write_session),
    current_user: dict | None = Depends(get_current_user),
):
    # -------------------- Extract anonymous_session_id from header --------------------
    anononymous_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anononymous_session_id = cookies["anonymous_session_id"].value

    owner_id = int(current_user.get("user_id")) if current_user else None

    # -------------------- Check Draft Limits --------------------
    query = select(Invitation).where(
        (Invitation.owner_id == owner_id)
        if owner_id
        else (Invitation.anon_session_id == anononymous_session_id)
    )
    result = await db.execute(query)
    existing_drafts = result.scalars().all()

    limit = 3 if current_user else 1
    if len(existing_drafts) >= limit:
        user_type = (
            "регистриран потребител" if current_user else "нерегистриран потребител"
        )
        draft_word = "чернова" if limit == 1 else "чернови"
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Достигнахте лимита от {limit} {draft_word} за {user_type}",
                "existingDraftId": existing_drafts[0].id,
            },
        )

    # -------------------- Create RSVP --------------------
    rsvp_obj = RSVP(ask_menu=False)
    db.add(rsvp_obj)
    await db.flush()

    # -------------------- Create Invitation --------------------
    invitation_obj = Invitation(
        title="",
        description="",
        extra_info="",
        rsvp_id=rsvp_obj.id,
        is_active=False,
        owner_id=owner_id,
        anon_session_id=None if current_user else anononymous_session_id,
    )

    db.add(invitation_obj)
    await db.commit()
    await db.refresh(invitation_obj)

    # -------------------- Eager-load relationships --------------------
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.events),
            selectinload(Invitation.slideshow_images),
        )
        .where(Invitation.id == invitation_obj.id)
    )
    invitation_with_rel = result.scalars().first()
    return invitation_with_rel


# -------------------- Update Invitation --------------------
@router.patch("/update/{invitation_id}", response_model=InvitationRead)
async def update_invitation(
    invitation_id: int,
    payload: InvitationUpdate,
    db: AsyncSession = Depends(get_write_session),
):
    invitation = await db.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # -------------------- Update invitation fields --------------------
    update_data = payload.dict(
        exclude_unset=True,
        exclude={
            "rsvp",
            "events",
            "slideshow_images",
            "owner_id",
            "anon_session_id",
            "is_active",
            "active_from",
            "active_until",
            "preview_token",
            "status",
        },
    )
    for key, value in update_data.items():
        setattr(invitation, key, value)

    # -------------------- RSVP / Events / Slideshow --------------------
    if payload.rsvp:
        rsvp_obj = invitation.rsvp
        if not rsvp_obj:
            rsvp_obj = RSVP(ask_menu=payload.rsvp.ask_menu)
            db.add(rsvp_obj)
            await db.flush()
            invitation.rsvp_id = rsvp_obj.id

        rsvp_data = payload.rsvp.dict(exclude_unset=True, exclude={"guests"})
        for key, value in rsvp_data.items():
            setattr(rsvp_obj, key, value)

    if payload.events is not None:
        for e in invitation.events:
            await db.delete(e)
        for event in payload.events:
            db.add(Event(**event.dict(), invitation_id=invitation.id))

    if hasattr(payload, "slideshow_images") and payload.slideshow_images is not None:
        for img in invitation.slideshow_images:
            await db.delete(img)
        for img_data in payload.slideshow_images:
            db.add(SlideshowImage(**img_data.dict(), invitation_id=invitation.id))

    # -------------------- Commit --------------------
    await db.commit()

    # -------------------- Re-fetch invitation with eager-loaded relationships --------------------
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.events),
        )
        .where(Invitation.id == invitation_id)
    )
    invitation_with_rel = result.scalars().first()

    return invitation_with_rel


# -------------------- List Invitations with Pagination --------------------
@router.get("/", response_model=dict)
async def list_invitations(
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
    anon_session_id: str | None = Cookie(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    offset = (page - 1) * page_size
    owner_id = int(current_user.get("user_id")) if current_user else None

    query = select(Invitation).options(
        selectinload(Invitation.rsvp).selectinload(RSVP.guests),
        selectinload(Invitation.events),
        selectinload(Invitation.category),
        selectinload(Invitation.subcategory),
        selectinload(Invitation.selected_game_obj),
        selectinload(Invitation.selected_slideshow_obj),
    )

    if owner_id:
        query = query.where(Invitation.owner_id == owner_id)
        total_result = await db.execute(
            select(Invitation).where(Invitation.owner_id == owner_id)
        )
    else:
        query = query.where(Invitation.anon_session_id == anon_session_id)
        total_result = await db.execute(
            select(Invitation).where(Invitation.anon_session_id == anon_session_id)
        )

    total_count = total_result.scalars().count()

    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    invitations = result.scalars().all()

    total_pages = (total_count + page_size - 1) // page_size

    return {
        "total_count": total_count,
        "current_page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": invitations,
    }


# -------------------- Delete Invitation --------------------
@router.delete("/delete/{invitation_id}", status_code=204)
async def delete_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_write_session),
):
    result = await db.execute(select(Invitation).where(Invitation.id == invitation_id))
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    await db.delete(invitation)
    await db.commit()
    return


@router.post("/wallpaper/{invitation_id}", response_model=InvitationRead)
async def upload_invitation_wallpaper(
    invitation_id: int,
    wallpaper: UploadFile = File(...),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    # --- WRITE PART ---
    invitation = await write_db.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    wallpaper_service = WallpaperService()

    # delete old wallpaper if exists
    if invitation.wallpaper:
        try:
            await wallpaper_service._delete(invitation.wallpaper)
        except Exception as e:
            print(f"Failed to delete old wallpaper: {e}")

    # upload new one
    url = await wallpaper_service.upload_wallpaper(wallpaper)
    invitation.wallpaper = url

    write_db.add(invitation)
    await write_db.commit()
    await write_db.refresh(invitation)

    # --- READ PART (fresh session) ---
    result = await read_db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
        )
        .where(Invitation.id == invitation.id)
    )
    invitation_with_rel = result.scalars().first()

    return invitation_with_rel


# -------------------- Upload slides (save) --------------------
@router.post("/slides/{invitation_id}", response_model=InvitationRead)
async def upload_slides(
    invitation_id: int,
    slides: list[UploadFile] = File(None),
    existing_slides: str = Form("[]"),  # JSON string from frontend
    selected_slideshow: str | None = Form(None),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    # Fetch invitation
    result = await write_db.execute(
        select(Invitation)
        .options(selectinload(Invitation.slideshow_images))
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(404, "Invitation not found")

    slide_service = SlideService()

    # Parse existing slides list (file_urls or null)
    try:
        existing_urls: list[str | None] = json.loads(existing_slides)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid existing_slides data")

    # Delete slides that are no longer kept
    for idx, url in enumerate(existing_urls):
        if url is None and idx < len(invitation.slideshow_images):
            old_slide = invitation.slideshow_images[idx]
            await slide_service._delete(old_slide.file_url)
            await write_db.delete(old_slide)

    # Keep only the slides still present
    invitation.slideshow_images = [
        s for s in invitation.slideshow_images if s.file_url in existing_urls
    ]

    # Handle selected slideshow
    selected_slideshow_obj = None
    if selected_slideshow not in (None, ""):
        result = await read_db.execute(
            select(Slideshow).where(Slideshow.id == int(selected_slideshow))
        )
        selected_slideshow_obj = result.scalars().first()
        if not selected_slideshow_obj:
            raise HTTPException(404, "Slideshow not found")
        invitation.selected_slideshow_obj = selected_slideshow_obj
        invitation.selected_slideshow = selected_slideshow_obj.key
    else:
        invitation.selected_slideshow = None
        invitation.selected_slideshow_obj = None

    # Upload new slides (new files in frontend)
    if slides:
        for idx, file in enumerate(slides):
            file_url = await slide_service.upload_slide(
                file, folder=f"slides/{invitation_id}"
            )
            invitation.slideshow_images.append(
                SlideshowImage(
                    file_url=file_url,
                    invitation_id=invitation.id,
                    slideshow_id=selected_slideshow_obj.id
                    if selected_slideshow_obj
                    else None,
                    order=len(invitation.slideshow_images),
                )
            )

    await write_db.commit()

    # Fetch full invitation with all relationships
    result = await read_db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
        )
        .where(Invitation.id == invitation.id)
    )
    invitation_full = result.scalars().first()

    if invitation_full.selected_slideshow_obj:
        invitation_full.selected_slideshow = invitation_full.selected_slideshow_obj.key
    else:
        invitation_full.selected_slideshow = None

    return InvitationRead.from_orm(invitation_full)
