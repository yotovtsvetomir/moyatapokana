import json
import re
from typing import Dict, Optional
from datetime import datetime
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
from transliterate import translit
from sqlalchemy import desc, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from app.db.session import get_write_session, get_read_session
from app.services.s3.wallpaper import WallpaperService
from app.services.s3.slide import SlideService
from app.services.s3.music import MusicService
from app.services.s3.copy import CopyService
from app.services.pagination import paginate
from app.services.search import apply_filters_search_ordering
from app.services.helpers import generate_google_calendar_link, generate_slug
from app.db.models.invitation import (
    Invitation,
    InvitationStatus,
    Template,
    RSVP,
    Event,
    SlideshowImage,
    Game,
    Slideshow,
    Guest,
    Font,
    Category,
    SubCategory
)
from app.schemas.invitation import (
    InvitationUpdate,
    InvitationRead,
    TemplateRead,
    ReadyToPurchaseResponse,
    GameRead,
    SlideshowRead,
    GuestCreate,
    GuestRead,
    RSVPWithStats,
    Stats,
    FontRead,
    PaginatedResponse,
)
from app.services.auth import get_current_user
from http.cookies import SimpleCookie
from typing import List


router = APIRouter()


# -------------------- Helper to fetch invitation with ownership --------------------
async def fetch_invitation(
    invitation_id: int,
    request: Request,
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
) -> Invitation:
    # Extract anon session ID from cookies
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        from http.cookies import SimpleCookie
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    # Fetch the invitation
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

    # ---------------- Access control ----------------

    # 1. Registered owner
    if current_user and invitation.owner_id == int(current_user.get("user_id")):
        return invitation

    # 2. Anonymous owner
    if invitation.anon_session_id and anon_session_id == invitation.anon_session_id:
        if invitation.is_active:
            raise HTTPException(status_code=403, detail="Access denied")  # anon owner cannot access active
        return invitation

    # 3. Guest access (registered or anonymous, not owners)
    if invitation.is_active:
        return invitation

    # 4. All other cases
    raise HTTPException(status_code=403, detail="Access denied")


async def fetch_invitation_by_slug(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
) -> Invitation:
    # Extract anon session ID from cookies
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        from http.cookies import SimpleCookie
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    # Fetch the invitation
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
        .where(Invitation.slug == slug)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # ---------------- Access control ----------------

    # 1. Registered owner
    if current_user and invitation.owner_id == int(current_user.get("user_id")):
        return invitation

    # 2. Anonymous owner
    if invitation.anon_session_id and anon_session_id == invitation.anon_session_id:
        if invitation.is_active:
            raise HTTPException(status_code=403, detail="Access denied")  # anon owner cannot access active
        return invitation

    # 3. Guest access (registered or anonymous, not owners)
    if invitation.is_active:
        return invitation

    # 4. All other cases
    raise HTTPException(status_code=403, detail="Access denied")


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


# ----------------- Get Invitation By Slug --------------
@router.get("/slug/{slug}", response_model=InvitationRead)
async def get_invitation_by_slug(
    invitation: Invitation = Depends(fetch_invitation_by_slug),
):
    return invitation


# -------------------- Create Empty Invitation --------------------
@router.post("/create", response_model=InvitationRead)
async def create_empty_invitation(
    request: Request,
    read_db: AsyncSession = Depends(get_read_session),
    write_db: AsyncSession = Depends(get_write_session),
    current_user: dict | None = Depends(get_current_user),
):
    # -------------------- Extract anonymous_session_id from header --------------------
    anonymous_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anonymous_session_id = cookies["anonymous_session_id"].value

    owner_id = int(current_user.get("user_id")) if current_user else None

    # -------------------- Check Draft Limits (read) --------------------
    query = select(Invitation).where(
        (
            (Invitation.owner_id == owner_id)
            if owner_id
            else (Invitation.anon_session_id == anonymous_session_id)
        )
        & (Invitation.status == InvitationStatus.DRAFT)
    )
    result = await read_db.execute(query)
    existing_drafts = result.scalars().all()

    limit = 3 if current_user else 1
    if len(existing_drafts) >= limit:
        user_type = "регистриран потребител" if current_user else "нерегистриран потребител"
        draft_word = "чернова" if limit == 1 else "чернови"
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Достигнахте лимита от {limit} {draft_word} за {user_type}",
                "existingDraftId": existing_drafts[0].id,
            },
        )

    # -------------------- Create RSVP (write) --------------------
    rsvp_obj = RSVP(ask_menu=False)
    write_db.add(rsvp_obj)
    await write_db.flush()

    slug = await generate_slug(read_db)

    # -------------------- Create Invitation (write) --------------------
    invitation_obj = Invitation(
        title="",
        description="",
        extra_info="",
        slug=slug,
        rsvp_id=rsvp_obj.id,
        is_active=False,
        owner_id=owner_id,
        anon_session_id=None if current_user else anonymous_session_id,
    )

    write_db.add(invitation_obj)
    await write_db.commit()
    await write_db.refresh(invitation_obj)

    # -------------------- Eager-load relationships (read) --------------------
    result = await read_db.execute(
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


@router.post("/create-from-template/{template_slug}", response_model=InvitationRead)
async def create_invitation_from_template(
    template_slug: str,
    request: Request,
    read_db: AsyncSession = Depends(get_write_session),
    write_db: AsyncSession = Depends(get_write_session),
    current_user: dict | None = Depends(get_current_user),
    delete_old: bool = Query(False),
):
    # -------------------- Fetch Template (read) --------------------
    result = await read_db.execute(
        select(Template)
        .options(
            selectinload(Template.slideshow_images),
            selectinload(Template.selected_game_obj),
            selectinload(Template.selected_slideshow_obj),
            selectinload(Template.font_obj),
            selectinload(Template.category),
            selectinload(Template.subcategory),
            selectinload(Template.subcategory_variant),
        )
        .where(Template.slug == template_slug)
    )
    template = result.scalars().first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # -------------------- Extract anon_session_id --------------------
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    owner_id = int(current_user.get("user_id")) if current_user else None

    # -------------------- Check Draft Limits (read) --------------------
    query = select(Invitation).where(
        (
            (Invitation.owner_id == owner_id)
            if owner_id
            else (Invitation.anon_session_id == anon_session_id)
        )
        & (Invitation.status == InvitationStatus.DRAFT)
    )
    result = await read_db.execute(query)
    existing_drafts = result.scalars().all()

    limit = 3 if current_user else 1
    if len(existing_drafts) >= limit:
        if not current_user:
            if delete_old:
                for draft in existing_drafts:
                    await write_db.delete(draft)
                await write_db.flush()
            else:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Достигнахте лимита от 1 чернова за нерегистриран потребител. Искате ли да изтриете старата и да създадете нова?",
                        "existingDraftId": existing_drafts[0].id,
                        "anon": True,
                    },
                )
        else:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": f"Достигнахте лимита от {limit} чернови",
                    "existingDraftId": existing_drafts[0].id,
                    "anon": False,
                },
            )

    # -------------------- Create RSVP (write) --------------------
    rsvp_obj = RSVP(ask_menu=False)
    write_db.add(rsvp_obj)
    await write_db.flush()

    slug = await generate_slug(read_db)

    # -------------------- Duplicate Invitation (write) --------------------
    new_invitation = Invitation(
        title=template.title,
        slug=slug,
        description=template.description,
        extra_info=template.extra_info,
        primary_color=template.primary_color,
        secondary_color=template.secondary_color,
        rsvp_id=rsvp_obj.id,
        selected_game=template.selected_game,
        selected_slideshow=template.selected_slideshow,
        selected_font=template.selected_font,
        is_active=False,
        owner_id=owner_id,
        anon_session_id=None if current_user else anon_session_id,
    )
    write_db.add(new_invitation)
    await write_db.flush()

    # -------------------- Initialize Copy Service --------------------
    copy_service = CopyService()

    # -------------------- Duplicate wallpaper --------------------
    if template.wallpaper:
        new_invitation.wallpaper = await copy_service.copy_file(template.wallpaper, folder="wallpapers")

    # -------------------- Duplicate background audio --------------------
    if template.background_audio:
        new_invitation.background_audio = await copy_service.copy_file(template.background_audio, folder="music")

    # -------------------- Duplicate slides --------------------
    for slide in template.slideshow_images:
        new_file_url = await copy_service.copy_file(slide.file_url, folder="slides")
        write_db.add(
            SlideshowImage(
                file_url=new_file_url,
                invitation_id=new_invitation.id,
                slideshow_id=slide.slideshow_id,
                order=slide.order,
            )
        )

    # -------------------- Commit all writes --------------------
    await write_db.commit()
    await write_db.refresh(new_invitation)

    # -------------------- Load invitation with relationships --------------------
    result = await write_db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
            selectinload(Invitation.slideshow_images),
            selectinload(Invitation.font_obj),
        )
        .where(Invitation.id == new_invitation.id)
    )
    invitation_with_rel = result.scalars().first()

    return invitation_with_rel


@router.get("/templates/{slug}", response_model=TemplateRead)
async def get_template_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_read_session),
):
    result = await db.execute(
        select(Template)
        .options(
            selectinload(Template.slideshow_images),
            selectinload(Template.selected_game_obj),
            selectinload(Template.selected_slideshow_obj),
            selectinload(Template.font_obj),
            selectinload(Template.category),
            selectinload(Template.subcategory),
            selectinload(Template.subcategory_variant),
        )
        .where(Template.slug == slug)
    )
    template = result.scalars().first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template

def slugifycats(name: str) -> str:
    latin_name = translit(name, reversed=True)
    slug = re.sub(r'[^a-z0-9]+', '-', latin_name.lower()).strip('-')
    return slug

def deslugifycats(slug: str) -> str:
    name_guess = slug.replace("-", " ")
    try:
        name_guess_cyrillic = translit(name_guess, "bg")
        return name_guess_cyrillic.capitalize()
    except Exception:
        return name_guess

# do not change url -> router can't handle it ...
@router.get("/templates/list/view", response_model=dict)
async def list_templates(
    db: AsyncSession = Depends(get_read_session),
    page: int = Query(1, ge=1),
    page_size: int = Query(7, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
    variant: Optional[str] = Query(None),
    ordering: str = Query("-created_at"),
):
    """List templates with filters, only released, using slugs for categories/subcategories/variants."""

    filters = [Template.is_released.is_(True)]

    # --- Resolve slugs to IDs ---
    if category:
        filters.append(Template.category.has(name=deslugifycats(category)))

    if subcategory:
        filters.append(Template.subcategory.has(name=deslugifycats(subcategory)))

    if variant:
        filters.append(Template.subcategory_variant.has(name=deslugifycats(variant)))

    # --- Apply search + ordering ---
    filters, order_by = await apply_filters_search_ordering(
        model=Template,
        db=db,
        search=search,
        search_columns=[Template.title, Template.description],
        filters=filters,
        ordering=ordering,
    )

    # --- Load related objects ---
    options = [
        selectinload(Template.slideshow_images),
        selectinload(Template.selected_game_obj),
        selectinload(Template.selected_slideshow_obj),
        selectinload(Template.font_obj),
        selectinload(Template.category),
        selectinload(Template.subcategory),
        selectinload(Template.subcategory_variant),
    ]

    paginated_templates: PaginatedResponse[TemplateRead] = await paginate(
        model=Template,
        db=db,
        page=page,
        page_size=page_size,
        options=options,
        schema=TemplateRead,
        extra_filters=filters,
        ordering=order_by,
    )

    # --- Fetch categories with subcategories and their variants ---
    category_result = await db.execute(
        select(Category).options(
            selectinload(Category.subcategories).selectinload(SubCategory.variants)
        )
    )
    categories = category_result.scalars().unique().all()

    # --- Build response including slugs ---
    category_list = [
        {
            "id": c.id,
            "name": c.name,
            "slug": slugifycats(c.name),
            "subcategories": [
                {
                    "id": s.id,
                    "name": s.name,
                    "slug": slugifycats(s.name),
                    "variants": [
                        {"id": v.id, "name": v.name, "slug": slugifycats(v.name)}
                        for v in s.variants
                    ],
                }
                for s in c.subcategories
            ],
        }
        for c in categories
    ]

    return {
        "templates": paginated_templates,
        "filters": {"categories": category_list},
    }


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
            "status",
        },
    )

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
        # Delete existing events
        events_result = await write_db.execute(
            select(Event).where(Event.invitation_id == invitation.id)
        )
        for e in events_result.scalars().all():
            await write_db.delete(e)

        for event_data in payload.events:
            start_dt = event_data.start_datetime
            end_dt = event_data.finish_datetime or start_dt

            calendar_link = generate_google_calendar_link(
                title=event_data.title,
                start=start_dt,
                end=end_dt,
                description=event_data.description or "",
                location=event_data.location or "",
            )

            # Create Event object and assign link
            event_obj = Event(**event_data.dict(), invitation_id=invitation.id)
            event_obj.calendar_link = calendar_link

            write_db.add(event_obj)

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


@router.get("/", response_model=dict)
async def list_invitations(
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
    anon_session_id: str | None = Cookie(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: InvitationStatus | None = None,
):
    owner_id = int(current_user.get("user_id")) if current_user else None

    if owner_id is None:
        raise HTTPException(
            status_code=403, detail="Not authorized"
        )

    options = [
        selectinload(Invitation.rsvp),
        selectinload(Invitation.events),
        selectinload(Invitation.selected_game_obj),
        selectinload(Invitation.selected_slideshow_obj),
        selectinload(Invitation.slideshow_images),
        selectinload(Invitation.font_obj),
    ]

    ordering = [desc(Invitation.created_at)]

    extra_filters = []
    if status:
        extra_filters.append(Invitation.status == status)

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
        ordering=ordering,
        extra_filters=extra_filters,
    )


# -------------------- Delete Invitation with full cleanup --------------------
@router.delete("/delete/{invitation_id}", status_code=204)
async def delete_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_write_session),
):
    # Fetch invitation with all relationships
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp)
            .selectinload(RSVP.guests)
            .selectinload(Guest.sub_guests),
            selectinload(Invitation.events),
            selectinload(Invitation.slideshow_images),
        )
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.is_active:
        raise HTTPException(
            status_code=403, detail="Cannot delete an active invitation"
        )

    # Services for S3 cleanup
    wallpaper_service = WallpaperService()
    slide_service = SlideService()
    music_service = MusicService()

    # -------------------- Delete wallpaper --------------------
    if invitation.wallpaper:
        try:
            await wallpaper_service._delete(invitation.wallpaper)
        except Exception as e:
            print(f"Failed to delete wallpaper: {e}")

    # -------------------- Delete background audio --------------------
    if invitation.background_audio:
        try:
            await music_service.delete_music(invitation.background_audio)
        except Exception as e:
            print(f"Failed to delete audio: {e}")

    # -------------------- Delete slideshow images --------------------
    for slide in invitation.slideshow_images:
        try:
            await slide_service._delete(slide.file_url)
        except Exception as e:
            print(f"Failed to delete slide {slide.id}: {e}")
        await db.delete(slide)

    # -------------------- Delete events --------------------
    for event in invitation.events:
        await db.delete(event)

    # -------------------- Delete RSVP & Guests --------------------
    if invitation.rsvp:
        for guest in invitation.rsvp.guests:
            # Reset sub-guests' main_guest_id if any
            for sub in guest.sub_guests:
                sub.main_guest_id = None
                db.add(sub)
            await db.delete(guest)
        await db.delete(invitation.rsvp)

    # -------------------- Finally, delete the invitation itself --------------------
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
    existing_slides: str = Form("[]"),
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
    request: Request,
    read_db: AsyncSession = Depends(get_read_session),
    write_db: AsyncSession = Depends(get_write_session),
    current_user: dict | None = Depends(get_current_user),
    confirm_add: bool = Query(False)
):
    # -------------------- Fetch Invitation --------------------
    result = await read_db.execute(select(Invitation).where(Invitation.slug == slug))
    invitation = result.scalars().first()

    if not invitation or not invitation.is_active:
        raise HTTPException(status_code=404, detail="Поканата не може да бъде намерена или е неактивна.")

    # --- Block owner (registered or anonymous) from RSVPing ---
    if current_user and invitation.owner_id == int(current_user.get("user_id")):
        raise HTTPException(status_code=400, detail="Собственикът на поканата не може да бъде добавен като гост.")

    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    if invitation.anon_session_id and anon_session_id == invitation.anon_session_id:
        raise HTTPException(status_code=400, detail="Собственикът на поканата не може да бъде добавен като гост.")

    # -------------------- Check duplicates (main + sub) --------------------
    # Prepare all names to check
    all_names = [(payload.first_name.strip(), payload.last_name.strip())]
    for sub in payload.sub_guests or []:
        all_names.append((sub.first_name.strip(), sub.last_name.strip()))

    # Query DB for any existing guests with these names for this RSVP
    duplicates = await read_db.execute(
        select(Guest.first_name, Guest.last_name)
        .where(
            Guest.rsvp_id == invitation.rsvp_id,
            tuple_(Guest.first_name, Guest.last_name).in_(
                [(fn, ln) for fn, ln in all_names]
            )
        )
    )
    existing = duplicates.all()

    if existing and not confirm_add:
        # Return the list of duplicates without adding
        duplicate_names = [f"{fn} {ln}" for fn, ln in existing]
        raise HTTPException(
            status_code=409,
            detail=f"Гост с това име вече е потвърден: {', '.join(duplicate_names)}. Моля потвърдете, ако искате да добавите."
        )

    # -------------------- Create Guest(s) --------------------
    main_guest = Guest(
        first_name=payload.first_name,
        last_name=payload.last_name,
        guest_type=payload.guest_type,
        is_main_guest=True,
        attending=payload.attending,
        menu_choice=payload.menu_choice,
        rsvp_id=invitation.rsvp_id,
    )
    write_db.add(main_guest)
    await write_db.flush()

    for sub in payload.sub_guests or []:
        sub_guest = Guest(
            first_name=sub.first_name,
            last_name=sub.last_name,
            guest_type=sub.guest_type,
            is_main_guest=False,
            attending=sub.attending,
            menu_choice=sub.menu_choice,
            main_guest_id=main_guest.id,
            rsvp_id=invitation.rsvp_id,
        )
        write_db.add(sub_guest)

    try:
        await write_db.commit()
        await write_db.refresh(main_guest)
    except IntegrityError:
        await write_db.rollback()
        raise HTTPException(status_code=400, detail="Failed to add guest(s)")

    # -------------------- Read created guest with sub_guests --------------------
    result = await read_db.execute(
        select(Guest)
        .where(Guest.id == main_guest.id)
        .options(selectinload(Guest.sub_guests))
    )
    guest_with_subs = result.scalars().first()

    return guest_with_subs


@router.get("/rsvp/{invitation_id}", response_model=RSVPWithStats)
async def get_rsvp_for_owner(
    invitation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_session),
    page: int = Query(1, ge=1),
    page_size: int = Query(7, ge=1, le=100),
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

    # --- Fetch all main guests with sub_guests ---
    guests_main = (
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

    # --- Flatten main + sub_guests into one list ---
    guests_all: list[Guest] = []
    for g in guests_main:
        guests_all.append(g)
        guests_all.extend(g.sub_guests)

    # --- Separate guests by attendance ---
    attending_guests = [g for g in guests_all if g.attending is True]
    not_attending_guests = [g for g in guests_all if g.attending is False]
    #unanswered_guests = [g for g in guests_all if g.attending is None]  # optional

    # --- Totals for attending ---
    total_attending = len(attending_guests)
    total_adults = sum(1 for g in attending_guests if g.guest_type != "kid")
    total_kids = sum(1 for g in attending_guests if g.guest_type == "kid")

    # --- Menu counts ---
    menu_counts: Dict[str, int] = {}
    for g in attending_guests:
        if g.menu_choice:
            menu_counts[g.menu_choice] = menu_counts.get(g.menu_choice, 0) + 1

    # --- Totals for not attending ---
    total_not_attending = len(not_attending_guests)

    # --- Total guests (attending + not attending + unanswered if desired) ---
    total_guests = len(guests_all)

    rsvp_stats = Stats(
        total_attending=total_attending,
        total_adults=total_adults,
        total_kids=total_kids,
        total_not_attending=total_not_attending,
        total_guests=total_guests,
        menu_counts=menu_counts,
    )

    # --- Extra filters for pagination (main guests only) ---
    extra_filters = [Guest.is_main_guest, Guest.rsvp_id == rsvp.id]

    if attending is not None:
        is_attending = attending.lower() == "true"
        extra_filters.append(Guest.attending == is_attending)

    # --- Apply search + ordering ---
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
