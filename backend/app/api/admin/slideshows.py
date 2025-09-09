from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_write_session, get_read_session
from app.db.models.invitation import Slideshow
from app.services.s3.presentation_image import PresentationImageService
from app.core.permissions import is_admin_authenticated

router = APIRouter()
templates = Jinja2Templates(directory="app/templates/admin/slideshows")

# -------------------- List --------------------
@router.get("/")
async def list_slideshows(db: AsyncSession = Depends(get_read_session), admin=Depends(is_admin_authenticated)):
    result = await db.execute(select(Slideshow).order_by(Slideshow.name))
    slideshows = result.scalars().all()
    return templates.TemplateResponse("list.html", {"request": {}, "slideshows": slideshows})

# -------------------- Create / Update Helper --------------------
async def handle_slideshow_upload(db, name: str, key: str, file: UploadFile | None, instance_id: int | None = None):
    service = PresentationImageService()
    if instance_id:
        instance = await db.get(Slideshow, instance_id)
        if not instance:
            raise HTTPException(404, "Slideshow not found")
        instance.name = name
        instance.key = key
    else:
        instance = Slideshow(name=name, key=key)

    if file and file.filename:
        if instance_id and getattr(instance, "presentation_image", None):
            try:
                await service.delete_image(instance.presentation_image)
            except Exception as e:
                print("Failed to delete old image:", e)
        instance.presentation_image = await service.upload_image(file)

    db.add(instance)
    await db.commit()
    return instance

@router.get("/new")
async def new_slideshow_form(admin=Depends(is_admin_authenticated)):
    return templates.TemplateResponse("new.html", {"request": {}})

# -------------------- Create --------------------
@router.post("/new")
async def create_slideshow(
    name: str = Form(...),
    key: str = Form(...),
    presentation_image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    await handle_slideshow_upload(db, name, key, presentation_image)
    return RedirectResponse(url="/admin/slideshows/", status_code=303)

# -------------------- Edit --------------------
@router.get("/{slideshow_id}/edit")
async def edit_slideshow_form(
    slideshow_id: int,
    db: AsyncSession = Depends(get_read_session),
    admin=Depends(is_admin_authenticated)
):
    slideshow = await db.get(Slideshow, slideshow_id)
    if not slideshow:
        return RedirectResponse(url="/admin/slideshows/", status_code=303)
    return templates.TemplateResponse(
        "edit.html",
        {"request": {}, "slideshow": slideshow}
    )

@router.post("/{slideshow_id}/edit")
async def update_slideshow(
    slideshow_id: int,
    name: str = Form(...),
    key: str = Form(...),
    presentation_image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    await handle_slideshow_upload(db, name, key, presentation_image, instance_id=slideshow_id)
    return RedirectResponse(url="/admin/slideshows/", status_code=303)

# -------------------- Delete --------------------
@router.post("/{slideshow_id}/delete")
async def delete_slideshow(
    slideshow_id: int,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated),
):
    slideshow = await db.get(Slideshow, slideshow_id)
    if not slideshow:
        return RedirectResponse(url="/admin/slideshows/", status_code=303)

    service = PresentationImageService()
    if getattr(slideshow, "presentation_image", None):
        try:
            await service.delete_image(slideshow.presentation_image)
        except Exception as e:
            print("Failed to delete image:", e)

    await db.delete(slideshow)
    await db.commit()
    return RedirectResponse(url="/admin/slideshows/", status_code=303)
