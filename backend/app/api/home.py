from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.session import get_read_session
from app.db.models.invitation import Template
from app.db.models.blog import BlogPost
from app.schemas.invitation import TemplateRead
from app.schemas.blog import BlogPostOut

router = APIRouter()

@router.get("/home")
async def get_home(db: AsyncSession = Depends(get_read_session)):
    """
    Get data for homepage:
    - Templates (7 latest with first_page=True)
    - Blog posts (2 latest)
    """

    # Templates query
    stmt_templates = (
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
        .where(Template.first_page.is_(True))
        .order_by(Template.created_at.desc())
        .limit(7)
    )

    result_templates = await db.execute(stmt_templates)
    templates = result_templates.scalars().all()

    # Blog posts query
    stmt_blogs = (
        select(BlogPost)
        .order_by(BlogPost.created_at.desc())
        .limit(2)
    )

    result_blogs = await db.execute(stmt_blogs)
    blogs = result_blogs.scalars().all()

    return {
        "templates": [TemplateRead.from_orm(t) for t in templates],
        "blogposts": [BlogPostOut.from_orm(b) for b in blogs],
    }
