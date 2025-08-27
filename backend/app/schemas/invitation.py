from datetime import datetime
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field


# -------------------- Guest --------------------
class GuestBase(BaseModel):
    first_name: str
    last_name: str
    guest_type: str
    is_main_guest: bool = False
    menu_choice: Optional[str] = None


class GuestCreate(GuestBase):
    pass


class GuestRead(GuestBase):
    id: int
    model_config = {"from_attributes": True}


# -------------------- RSVP --------------------
class RSVPBase(BaseModel):
    ask_menu: bool = False


class RSVPCreate(RSVPBase):
    guests: List[GuestCreate] = []


class RSVPRead(RSVPBase):
    id: int
    guests: List[GuestRead] = []
    model_config = {"from_attributes": True}


# -------------------- Category / SubCategory --------------------
class SubCategoryRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class CategoryRead(BaseModel):
    id: int
    name: str
    subcategories: Optional[List[SubCategoryRead]] = []
    model_config = {"from_attributes": True}


# -------------------- Game / Slideshow --------------------
class GameRead(BaseModel):
    id: int
    name: str
    key: str
    model_config = {"from_attributes": True}


class SlideshowRead(BaseModel):
    id: int
    name: str
    key: str
    model_config = {"from_attributes": True}


# -------------------- Slideshow Image --------------------
class SlideshowImageBase(BaseModel):
    file_url: str
    order: Optional[int] = 0
    slideshow_id: int
    invitation_id: int


class SlideshowImageCreate(SlideshowImageBase):
    pass


class SlideshowImageUpdate(BaseModel):
    file_url: Optional[str] = None
    order: Optional[int] = None


class SlideshowImageRead(SlideshowImageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# -------------------- Event --------------------
class EventBase(BaseModel):
    title: str
    start_datetime: datetime
    finish_datetime: datetime
    location: Optional[str] = None
    description: Optional[str] = None
    calendar_link: Optional[str] = None
    location_link: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class EventRead(EventBase):
    id: int
    model_config = {"from_attributes": True}


# -------------------- Invitation --------------------
class InvitationBase(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    extra_info: Optional[str] = None
    selected_game: Optional[str] = None
    selected_game_obj: Optional[GameRead] = None
    selected_slideshow: Optional[str] = None
    selected_slideshow_obj: Optional[SlideshowRead] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    wallpaper: Optional[str] = None
    background_audio: Optional[str] = None
    font: Optional[str] = None
    owner_id: Optional[int] = None
    anon_session_id: Optional[str] = None
    preview_token: Optional[str] = None
    active_from: Optional[datetime] = None
    active_until: Optional[datetime] = None
    is_active: Optional[bool] = False
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    template_id: Optional[int] = None


class InvitationCreate(InvitationBase):
    rsvp: RSVPCreate
    events: Annotated[List[EventCreate], Field(min_length=1)]
    slideshow_images: Optional[List[SlideshowImageCreate]] = None


class InvitationUpdate(InvitationBase):
    rsvp: Optional[RSVPCreate] = None
    events: Optional[List[EventUpdate]] = None
    slideshow_images: Optional[List[SlideshowImageCreate]] = None

    class Config:
        extra = "forbid"


class InvitationRead(InvitationBase):
    id: int
    status: str
    rsvp: RSVPRead
    events: List[EventRead] = []
    slideshow_images: List[SlideshowImageRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# -------------------- Template --------------------
class TemplateBase(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    extra_info: Optional[str] = None
    selected_game: Optional[str] = None
    selected_slideshow: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    wallpaper: Optional[str] = None
    background_audio: Optional[str] = None
    font: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(TemplateBase):
    pass


class TemplateRead(TemplateBase):
    id: int
    category: Optional[CategoryRead] = None
    subcategory: Optional[SubCategoryRead] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
