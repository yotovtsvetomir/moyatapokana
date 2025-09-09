from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BlogPostBase(BaseModel):
    title: str
    image: Optional[str] = None
    paragraphs: List[str]
    authored_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    image: Optional[str] = None
    paragraphs: Optional[List[str]] = None

class BlogPostOut(BlogPostBase):
    id: int
    slug: str

    model_config = {
        "from_attributes": True
    }
