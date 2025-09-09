from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_write_session, get_read_session
from app.db.models.blog import BlogPost
from app.services.s3.presentation_image import PresentationImageService
from app.core.permissions import is_admin_authenticated
from app.services.helpers import generate_slug
from datetime import datetime


router = APIRouter()
templates = Jinja2Templates(directory="app/templates/admin/blogs")


# -------------------- List --------------------
@router.get("/")
async def list_blog_posts(db: AsyncSession = Depends(get_read_session), admin=Depends(is_admin_authenticated)):
    result = await db.execute(select(BlogPost).order_by(BlogPost.id.desc()))
    posts = result.scalars().all()
    return templates.TemplateResponse("list.html", {"request": {}, "posts": posts})


# -------------------- Create / Update Helper --------------------
async def handle_blog_post_upload(
    db: AsyncSession,
    title: str,
    paragraphs: list[str],
    authored_by: str | None = None,
    image_file: UploadFile | None = None,
    instance_id: int | None = None
):
    service = PresentationImageService()
    now = datetime.utcnow()

    if instance_id:
        # Update existing post
        instance = await db.get(BlogPost, instance_id)
        if not instance:
            raise HTTPException(404, "Blog post not found")
        instance.title = title
        instance.paragraphs = paragraphs
        instance.updated_at = now
        instance.slug = generate_slug(title)
        if authored_by:
            instance.authored_by = authored_by
    else:
        # Create new post
        instance = BlogPost(
            title=title,
            paragraphs=paragraphs,
            slug=generate_slug(title),
            authored_by=authored_by,
            created_at=now,
            updated_at=None
        )

    # Handle image upload
    if image_file and image_file.filename:
        if instance_id and getattr(instance, "image", None):
            try:
                await service.delete_image(instance.image)
            except Exception as e:
                print("Failed to delete old image:", e)
        instance.image = await service.upload_image(image_file)

    db.add(instance)
    await db.commit()
    return instance


# -------------------- New Form --------------------
@router.get("/new")
async def new_blog_form(admin=Depends(is_admin_authenticated)):
    return templates.TemplateResponse("new.html", {"request": {}})


# -------------------- Create --------------------
@router.post("/new")
async def create_blog_post(
    title: str = Form(...),
    paragraphs: str = Form(...),
    authored_by: str = Form(None),
    image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated)
):
    import json
    try:
        paragraphs_list = json.loads(paragraphs)
        if not isinstance(paragraphs_list, list):
            raise ValueError()
    except Exception:
        paragraphs_list = [p.strip() for p in paragraphs.split("\n") if p.strip()]

    await handle_blog_post_upload(
        db, title, paragraphs_list, authored_by=authored_by, image_file=image
    )
    return RedirectResponse(url="/admin/blogs/", status_code=303)


# -------------------- Edit --------------------
@router.get("/{post_id}/edit")
async def edit_blog_form(post_id: int, db: AsyncSession = Depends(get_read_session), admin=Depends(is_admin_authenticated)):
    post = await db.get(BlogPost, post_id)
    if not post:
        return RedirectResponse(url="/admin/blogs/", status_code=303)
    return templates.TemplateResponse("edit.html", {"request": {}, "post": post})


@router.post("/{post_id}/edit")
async def update_blog_post(
    post_id: int,
    title: str = Form(...),
    paragraphs: str = Form(...),
    authored_by: str = Form(None),
    image: UploadFile = None,
    db: AsyncSession = Depends(get_write_session),
    admin=Depends(is_admin_authenticated)
):
    import json
    try:
        paragraphs_list = json.loads(paragraphs)
        if not isinstance(paragraphs_list, list):
            raise ValueError()
    except Exception:
        paragraphs_list = [p.strip() for p in paragraphs.split("\n") if p.strip()]

    await handle_blog_post_upload(
        db, title, paragraphs_list, authored_by=authored_by, image_file=image, instance_id=post_id
    )
    return RedirectResponse(url="/admin/blogs/", status_code=303)


# -------------------- Delete --------------------
@router.post("/{post_id}/delete")
async def delete_blog_post(post_id: int, db: AsyncSession = Depends(get_write_session), admin=Depends(is_admin_authenticated)):
    post = await db.get(BlogPost, post_id)
    if not post:
        return RedirectResponse(url="/admin/blogs/", status_code=303)

    service = PresentationImageService()
    if getattr(post, "image", None):
        try:
            await service.delete_image(post.image)
        except Exception as e:
            print("Failed to delete image:", e)

    await db.delete(post)
    await db.commit()
    return RedirectResponse(url="/admin/blogs/", status_code=303)
