from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db.session import get_read_session
from app.db.models.invitation import Template
from app.schemas.invitation import TemplateRead

router = APIRouter()


@router.get("/home", response_model=List[TemplateRead])
async def get_home(db: AsyncSession = Depends(get_read_session)):
    """
    Get templates for the homepage:
    - Only where first_page=True
    - Ordered by created_at (descending)
    - Limited to 7 results
    - Preload related objects for efficient querying
    """
    stmt = (
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

    result = await db.execute(stmt)
    templates = result.scalars().all()
    return templates
