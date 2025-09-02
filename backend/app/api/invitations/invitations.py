import json
import uuid
import re
from typing import Dict
from datetime import datetime
from unidecode import unidecode
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
from sqlalchemy.exc import IntegrityError
from app.db.session import get_write_session, get_read_session
from app.services.s3.wallpaper import WallpaperService
from app.services.s3.slide import SlideService
from app.services.s3.music import MusicService
from app.services.pagination import paginate
from app.services.search import apply_filters_search_ordering
from app.db.models.invitation import (
    Invitation,
    RSVP,
    Event,
    SlideshowImage,
    Game,
    Slideshow,
    Guest,
    Font,
)
from app.schemas.invitation import (
    InvitationUpdate,
    InvitationRead,
    ReadyToPurchaseResponse,
    GameRead,
    SlideshowRead,
    GuestCreate,
    GuestRead,
    RSVPWithStats,
    Stats,
    FontRead,
)
from app.services.auth import get_current_user
from http.cookies import SimpleCookie
from typing import List


router = APIRouter()


def generate_slug(title: str) -> str:
    title_ascii = unidecode(title)
    slug_base = re.sub(r"[^a-zA-Z0-9]+", "-", title_ascii.lower()).strip("-")
    slug = f"{slug_base}-{uuid.uuid4().hex[:16]}"
    return slug


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
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
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


# -------------------- List all games/slideshows/fonts --------------------
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


@router.get("/fonts", response_model=list[FontRead])
async def list_fonts(db: AsyncSession = Depends(get_read_session)):
    result = await db.execute(select(Font))
    fonts = result.scalars().all()
    return fonts


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
            selectinload(Invitation.rsvp),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.events),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
        )
        .where(Invitation.id == invitation_obj.id)
    )
    invitation_with_rel = result.scalars().first()
    return invitation_with_rel


@router.patch("/update/{invitation_id}", response_model=InvitationRead)
async def update_invitation(
    invitation_id: int,
    payload: InvitationUpdate,
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    # -------------------- WRITE PART --------------------
    invitation = await write_db.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Поканата не е намерена")

    # -------------------- FORBID EDIT ON ACTIVE --------------------
    now = datetime.utcnow()
    if invitation.is_active and (
        (invitation.active_from and invitation.active_from <= now)
        and (invitation.active_until is None or invitation.active_until >= now)
    ):
        raise HTTPException(
            status_code=403, detail="Не можете да редактирате активна покана"
        )

    # Update main invitation fields
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

    if "title" in update_data and update_data["title"]:
        update_data["slug"] = generate_slug(update_data["title"])

    for key, value in update_data.items():
        setattr(invitation, key, value)

    # -------------------- RSVP, Events, Slideshow handling --------------------
    if payload.rsvp:
        rsvp_obj = None
        if invitation.rsvp_id:
            rsvp_obj = await write_db.get(RSVP, invitation.rsvp_id)

        if not rsvp_obj:
            rsvp_obj = RSVP(ask_menu=payload.rsvp.ask_menu)
            write_db.add(rsvp_obj)
            await write_db.flush()
            invitation.rsvp_id = rsvp_obj.id

        rsvp_data = payload.rsvp.dict(exclude_unset=True, exclude={"guests"})
        for key, value in rsvp_data.items():
            setattr(rsvp_obj, key, value)

    if payload.events is not None:
        events_result = await write_db.execute(
            select(Event).where(Event.invitation_id == invitation.id)
        )
        for e in events_result.scalars().all():
            await write_db.delete(e)

        for event in payload.events:
            write_db.add(Event(**event.dict(), invitation_id=invitation.id))

    if hasattr(payload, "slideshow_images") and payload.slideshow_images is not None:
        images_result = await write_db.execute(
            select(SlideshowImage).where(SlideshowImage.invitation_id == invitation.id)
        )
        for img in images_result.scalars().all():
            await write_db.delete(img)

        for img_data in payload.slideshow_images:
            write_db.add(SlideshowImage(**img_data.dict(), invitation_id=invitation.id))

    # Commit all writes
    await write_db.commit()

    # -------------------- READ PART (fresh session) --------------------
    result = await read_db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
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
    owner_id = int(current_user.get("user_id")) if current_user else None

    options = [
        selectinload(Invitation.rsvp),
        selectinload(Invitation.events),
        selectinload(Invitation.selected_game_obj),
        selectinload(Invitation.selected_slideshow_obj),
        selectinload(Invitation.slideshow_images),
        selectinload(Invitation.font_obj),
    ]

    return await paginate(
        model=Invitation,
        db=db,
        page=page,
        page_size=page_size,
        owner_field="owner_id",
        owner_id=owner_id,
        anon_field="anon_session_id",
        anon_session_id=anon_session_id,
        options=options,
        schema=InvitationRead,
    )


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

    if invitation.is_active:
        raise HTTPException(
            status_code=403, detail="Cannot delete an active invitation"
        )

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
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
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
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
        )
        .where(Invitation.id == invitation.id)
    )
    invitation_full = result.scalars().first()

    if invitation_full.selected_slideshow_obj:
        invitation_full.selected_slideshow = invitation_full.selected_slideshow_obj.key
    else:
        invitation_full.selected_slideshow = None

    return InvitationRead.from_orm(invitation_full)


@router.post("/upload-audio/{invitation_id}", response_model=InvitationRead)
async def upload_invitation_audio(
    invitation_id: int,
    audio: UploadFile | None = File(None),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    music_service = MusicService()

    # --- WRITE PART ---
    invitation = await write_db.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Delete old background audio if exists
    if invitation.background_audio:
        try:
            await music_service.delete_music(invitation.background_audio)
        except Exception as e:
            print(f"Failed to delete old audio: {e}")
        invitation.background_audio = None

    # Upload new audio only if provided
    if audio is not None:
        url = await music_service.upload_music(audio)
        invitation.background_audio = url

    write_db.add(invitation)
    await write_db.commit()
    await write_db.refresh(invitation)

    # --- READ PART (fresh session) ---
    result = await read_db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
        )
        .where(Invitation.id == invitation.id)
    )
    invitation_with_rel = result.scalars().first()

    return invitation_with_rel


# -------------------- RSVP / Guest Endpoints --------------------
@router.post("/guest/{slug}", response_model=GuestRead)
async def add_guest(
    slug: str,
    payload: GuestCreate,
    db: AsyncSession = Depends(get_write_session),
):
    # Fetch invitation
    result = await db.execute(select(Invitation).where(Invitation.slug == slug))
    invitation = result.scalars().first()

    if not invitation or not invitation.is_active:
        raise HTTPException(
            status_code=404, detail="Поканата не може да бъде намерена или е неактивна."
        )

    # Create main guest
    main_guest = Guest(
        first_name=payload.first_name,
        last_name=payload.last_name,
        guest_type=payload.guest_type,
        is_main_guest=True,
        menu_choice=payload.menu_choice,
        rsvp_id=invitation.rsvp_id,
    )
    db.add(main_guest)
    await db.flush()

    # Add sub-guests if provided
    if payload.sub_guests:
        for sub in payload.sub_guests:
            sub_guest = Guest(
                first_name=sub.first_name,
                last_name=sub.last_name,
                guest_type=sub.guest_type,
                is_main_guest=False,
                menu_choice=sub.menu_choice,
                main_guest_id=main_guest.id,
                rsvp_id=invitation.rsvp_id,
            )
            db.add(sub_guest)

    try:
        await db.commit()
        await db.refresh(main_guest)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Failed to add guest(s)")

    return main_guest


@router.get("/rsvp/{invitation_id}", response_model=RSVPWithStats)
async def get_rsvp_for_owner(
    invitation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_session),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    attending: str | None = Query(None),
    search: str | None = Query(None),
    ordering: str = Query("-created_at"),
):
    # --- Validate invitation ---
    result = await db.execute(
        select(Invitation)
        .where(Invitation.id == invitation_id)
        .options(selectinload(Invitation.rsvp))
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.owner_id != int(current_user.get("user_id")):
        raise HTTPException(status_code=403, detail="Access denied")

    rsvp = invitation.rsvp

    # --- Stats (all guests) ---
    guests_all = (
        (
            await db.execute(
                select(Guest)
                .where(Guest.rsvp_id == rsvp.id)
                .options(selectinload(Guest.sub_guests))
            )
        )
        .scalars()
        .all()
    )

    total_attending = len([g for g in guests_all if g.attending])
    total_adults = len([g for g in guests_all if g.guest_type != "kid"])
    total_kids = len([g for g in guests_all if g.guest_type == "kid"])

    menu_counts: Dict[str, int] = {}
    for g in guests_all:
        if g.menu_choice:
            menu_counts[g.menu_choice] = menu_counts.get(g.menu_choice, 0) + 1

    rsvp_stats = Stats(
        total_attending=total_attending,
        total_adults=total_adults,
        total_kids=total_kids,
        menu_counts=menu_counts,
    )

    # --- Extra filters for pagination ---
    extra_filters = [Guest.is_main_guest, Guest.rsvp_id == rsvp.id]

    if attending is not None:
        is_attending = attending.lower() == "true"
        extra_filters.append(Guest.attending == is_attending)

    # --- Use generic helper for search + ordering ---
    extra_filters, order_by = await apply_filters_search_ordering(
        model=Guest,
        db=db,
        search=search,
        search_columns=[Guest.full_name],
        filters=extra_filters,
        ordering=ordering,
    )

    # --- Paginate main guests ---
    paginated_main_guests = await paginate(
        model=Guest,
        db=db,
        page=page,
        page_size=page_size,
        extra_filters=extra_filters,
        schema=GuestRead,
        options=[selectinload(Guest.sub_guests)],
        ordering=order_by,
    )

    return RSVPWithStats(
        id=rsvp.id,
        ask_menu=rsvp.ask_menu,
        stats=rsvp_stats,
        guests=paginated_main_guests,
    )


MANDATORY_INVITATION_FIELDS = [
    "title",
    "description",
    "primary_color",
    "secondary_color",
    "wallpaper",
    "font_obj",
]

MANDATORY_EVENT_FIELDS = [
    "title",
    "start_datetime",
    "location",
    "description",
]

FIELD_LABELS_BG = {
    # Invitation fields
    "title": "Заглавие",
    "description": "Описание",
    "primary_color": "Основен цвят",
    "secondary_color": "Вторичен цвят",
    "wallpaper": "Фонова снимка",
    "font_obj": "Шрифт",
    # Event fields
    "title_event": "Заглавие на събитието",
    "start_datetime": "Начална дата/час",
    "location": "Място",
    "description_event": "Описание на събитието",
}


@router.get(
    "/{invitation_id}/ready",
    response_model=ReadyToPurchaseResponse,
)
async def check_ready_to_purchase(
    invitation_id: int, db: AsyncSession = Depends(get_read_session)
):
    """Check if an invitation has all mandatory fields filled before purchase."""
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
        )
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation_data = InvitationRead.model_validate(invitation)
    missing: List[str] = []

    # --- Invitation fields ---
    for field in MANDATORY_INVITATION_FIELDS:
        if not getattr(invitation_data, field, None):
            missing.append(f"{FIELD_LABELS_BG.get(field, field)}")

    # --- Events ---
    if not invitation_data.events or len(invitation_data.events) == 0:
        missing.append("events")
    else:
        for idx, event in enumerate(invitation_data.events):
            for field in MANDATORY_EVENT_FIELDS:
                # Use separate key for event description to avoid duplicates
                field_key = f"{field}_event" if field == "description" else field
                if not getattr(event, field, None):
                    missing.append(
                        f"Събитие[{idx}] - {FIELD_LABELS_BG.get(field_key, field)}"
                    )

    return ReadyToPurchaseResponse(
        ready=len(missing) == 0,
        missing=missing or None,
    )
