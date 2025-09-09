from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_read_session
from app.db.models.blog import BlogPost
from app.schemas.blog import BlogPostOut

router = APIRouter()

@router.get("/", response_model=List[BlogPostOut])
async def list_blog_posts(db: AsyncSession = Depends(get_read_session)):
    """
    Get all blog posts.
    """
    result = await db.execute(select(BlogPost).order_by(BlogPost.id.desc()))
    posts = result.scalars().all()
    if not posts:
        raise HTTPException(status_code=404, detail="No blog posts found")
    return posts


@router.get("/{slug}", response_model=BlogPostOut)
async def get_blog_post(slug: str, db: AsyncSession = Depends(get_read_session)):
    """
    Get a single blog post by slug.
    """
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug)
    )
    post = result.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post
