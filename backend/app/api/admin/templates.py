from fastapi import APIRouter, Request, Depends, Form, UploadFile, File, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_write_session, get_read_session
from app.db.models.invitation import Template, Category, SubCategory, Font, Game, Slideshow, SlideshowImage
from app.services.s3.wallpaper import WallpaperService
from app.services.s3.music import MusicService
from app.services.s3.slide import SlideService
from app.services.helpers import generate_slug
from app.core.permissions import is_admin_authenticated

router = APIRouter()
jinja_templates = Jinja2Templates(directory="app/templates/admin/templates")


# -------------------- Helpers --------------------
async def upload_file(file: UploadFile, service, old_url: str | None = None):
    if old_url:
        try:
            await service.delete_slide(old_url)
        except Exception as e:
            print("Failed to delete old file:", e)
    return await service.upload_slide(file)


# -------------------- List --------------------
@router.get("/")
async def list_templates(
    request: Request,
    db: AsyncSession = Depends(get_read_session),
    admin=Depends(is_admin_authenticated),
):
    result = await db.execute(
        select(Template)
        .options(
            selectinload(Template.category),
            selectinload(Template.subcategory),
            selectinload(Template.font_obj),
            selectinload(Template.selected_game_obj),
            selectinload(Template.selected_slideshow_obj),
            selectinload(Template.slideshow_images),
        )
        .order_by(Template.created_at.desc())
    )
    templates_list = result.scalars().all()
    return jinja_templates.TemplateResponse(
        "list.html", {"request": request, "templates": templates_list}
    )


# -------------------- New Form --------------------
@router.get("/new")
async def new_template_form(
    request: Request,
    db: AsyncSession = Depends(get_read_session),
    admin=Depends(is_admin_authenticated),
):
    categories = (await db.execute(select(Category).order_by(Category.name))).scalars().all()
    subcategories = (await db.execute(select(SubCategory).order_by(SubCategory.name))).scalars().all()
    fonts = (await db.execute(select(Font).order_by(Font.label))).scalars().all()
    games = (await db.execute(select(Game).order_by(Game.name))).scalars().all()
    slideshows = (await db.execute(select(Slideshow).order_by(Slideshow.name))).scalars().all()

    return jinja_templates.TemplateResponse(
        "new.html",
        {
            "request": request,
            "categories": categories,
            "subcategories": subcategories,
            "fonts": fonts,
            "games": games,
            "slideshows": slideshows,
        },
    )


# -------------------- Create --------------------
@router.post("/new")
async def create_template(
    request: Request,
    title: str = Form(...),
    description: str = Form(None),
    category_id: int = Form(None),
    subcategory_id: Optional[str] = Form(None),
    font_value: str = Form(None),
    primary_color: str = Form(None),
    secondary_color: str = Form(None),
    is_released: bool = Form(False),
    game_key: str = Form(None),
    slideshow_key: str = Form(None),
    wallpaper: UploadFile = File(None),
    music: UploadFile = File(None),
    slide_images: list[UploadFile] = File(None),
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    # Filter out empty uploads
    slide_images = [f for f in (slide_images or []) if f.filename]

    # Enforce exactly 5 slides
    if len(slide_images) != 5:
        raise HTTPException(400, "Exactly 5 slides must be uploaded")

    # Convert slideshow_key to numeric id
    slideshow_obj = None
    slideshow_id = None
    if slideshow_key:
        result = await db.execute(select(Slideshow).where(Slideshow.key == slideshow_key))
        slideshow_obj = result.scalar_one_or_none()
        if not slideshow_obj:
            raise HTTPException(400, "Invalid slideshow selected")
        slideshow_id = slideshow_obj.id

    tpl = Template(
        title=title,
        slug=generate_slug(title),
        description=description,
        category_id=category_id,
        subcategory_id=int(subcategory_id) if subcategory_id else None,
        selected_font=font_value,
        primary_color=primary_color,
        secondary_color=secondary_color,
        selected_game=game_key,
        selected_slideshow=slideshow_key,
        is_released=is_released,
    )

    # Upload wallpaper and music
    if wallpaper and wallpaper.filename:
        tpl.wallpaper = await WallpaperService().upload_wallpaper(wallpaper)
    if music and music.filename:
        tpl.background_audio = await MusicService().upload_music(music)

    db.add(tpl)
    await db.commit()  # commit to get tpl.id

    # Handle slides
    slide_service = SlideService()
    for idx, f in enumerate(slide_images):
        url = await slide_service.upload_slide(f)
        slide = SlideshowImage(
            file_url=url,
            template_id=tpl.id,
            slideshow_id=slideshow_id,
            order=idx,
        )
        db.add(slide)

    await db.commit()
    return RedirectResponse(url="/admin/templates/", status_code=303)


# -------------------- Edit Form --------------------
@router.get("/{template_id}/edit")
async def edit_template_form(
    request: Request,
    template_id: int,
    db: AsyncSession = Depends(get_read_session),
    admin=Depends(is_admin_authenticated)
):
    result = await db.execute(
        select(Template)
        .options(
            selectinload(Template.category),
            selectinload(Template.subcategory),
            selectinload(Template.font_obj),
            selectinload(Template.selected_game_obj),
            selectinload(Template.selected_slideshow_obj),
            selectinload(Template.slideshow_images)
        )
        .where(Template.id == template_id)
    )
    tpl = result.scalar_one_or_none()

    if not tpl:
        return RedirectResponse("/admin/templates/", status_code=303)

    categories = (await db.execute(select(Category).order_by(Category.name))).scalars().all()
    subcategories = (await db.execute(select(SubCategory).order_by(SubCategory.name))).scalars().all()
    fonts = (await db.execute(select(Font).order_by(Font.label))).scalars().all()
    games = (await db.execute(select(Game).order_by(Game.name))).scalars().all()
    slideshows = (await db.execute(select(Slideshow).order_by(Slideshow.name))).scalars().all()

    return jinja_templates.TemplateResponse(
        "edit.html",
        {
            "request": request,
            "tpl": tpl,
            "categories": categories,
            "subcategories": subcategories,
            "fonts": fonts,
            "games": games,
            "slideshows": slideshows,
        },
    )


# -------------------- Update --------------------
@router.post("/{template_id}/edit")
async def update_template(
    request: Request,
    template_id: int,
    title: str = Form(...),
    description: str = Form(None),
    category_id: int = Form(None),
    subcategory_id: Optional[str] = Form(None),
    wallpaper: UploadFile = File(None),
    music: UploadFile = File(None),
    font_value: str = Form(None),
    slide_images: list[UploadFile] = File(None),
    slideshow_key: str = Form(None),
    primary_color: str = Form(None),
    secondary_color: str = Form(None),
    is_released: bool = Form(False),
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    tpl = await db.get(Template, template_id)
    if not tpl:
        return RedirectResponse("/admin/templates/", status_code=303)

    tpl.title = title
    tpl.slug = generate_slug(title)
    tpl.description = description
    tpl.category_id = category_id
    tpl.subcategory_id = int(subcategory_id) if subcategory_id not in (None, "") else None
    tpl.selected_slideshow = slideshow_key
    tpl.primary_color = primary_color
    tpl.secondary_color = secondary_color
    tpl.is_released = is_released
    tpl.selected_font = font_value

    # Convert slideshow_key to numeric id
    slideshow_id = None
    if slideshow_key:
        result = await db.execute(select(Slideshow).where(Slideshow.key == slideshow_key))
        slideshow_obj = result.scalar_one_or_none()
        if not slideshow_obj:
            raise HTTPException(400, "Invalid slideshow selected")
        slideshow_id = slideshow_obj.id

    # Upload/update wallpaper
    if wallpaper and wallpaper.filename:
        wallpaper_service = WallpaperService()
        if tpl.wallpaper:
            try:
                await wallpaper_service.delete_wallpaper(tpl.wallpaper)
            except Exception as e:
                print("Failed to delete old wallpaper:", e)
        tpl.wallpaper = await wallpaper_service.upload_wallpaper(wallpaper)

    # Upload/update music
    if music and music.filename:
        music_service = MusicService()
        if tpl.background_audio:
            try:
                await music_service.delete_music(tpl.background_audio)
            except Exception as e:
                print("Failed to delete old music:", e)
        tpl.background_audio = await music_service.upload_music(music)

    # Handle slides
    slide_images = [f for f in (slide_images or []) if f.filename]
    slide_service = SlideService()
    if slide_images:
        if len(slide_images) != 5:
            raise HTTPException(400, "Exactly 5 slides must be uploaded")
        # Delete old slides
        result = await db.execute(select(SlideshowImage).where(SlideshowImage.template_id == tpl.id))
        old_slides = result.scalars().all()
        for old_slide in old_slides:
            try:
                await slide_service.delete_slide(old_slide.file_url)
                await db.delete(old_slide)
            except Exception as e:
                print("Failed to delete old slide:", e)
        # Add new slides
        for idx, f in enumerate(slide_images):
            url = await slide_service.upload_slide(f)
            slide = SlideshowImage(
                file_url=url,
                template_id=tpl.id,
                slideshow_id=slideshow_id,
                order=idx,
            )
            db.add(slide)

    db.add(tpl)
    await db.commit()
    return RedirectResponse(url="/admin/templates/", status_code=303)


# -------------------- Delete --------------------
@router.post("/{template_id}/delete")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    tpl = await db.get(Template, template_id)
    if not tpl:
        return RedirectResponse(url="/admin/templates/", status_code=303)

    wallpaper_service = WallpaperService()
    music_service = MusicService()
    slide_service = SlideService()

    # Delete wallpaper
    if tpl.wallpaper:
        try:
            await wallpaper_service.delete_wallpaper(tpl.wallpaper)
        except Exception as e:
            print("Failed to delete wallpaper:", e)

    # Delete background music
    if tpl.background_audio:
        try:
            await music_service.delete_music(tpl.background_audio)
        except Exception as e:
            print("Failed to delete music:", e)

    # Delete slides
    result = await db.execute(select(SlideshowImage).where(SlideshowImage.template_id == tpl.id))
    slides = result.scalars().all()
    for slide in slides:
        try:
            await slide_service.delete_slide(slide.file_url)
            await db.delete(slide)
        except Exception as e:
            print("Failed to delete slide:", e)

    # Delete template itself
    await db.delete(tpl)
    await db.commit()
    return RedirectResponse(url="/admin/templates/", status_code=303)
