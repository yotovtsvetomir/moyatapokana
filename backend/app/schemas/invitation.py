from datetime import datetime
from typing import List, Dict, Optional, Annotated, TypeVar, Generic
from pydantic import BaseModel, Field
from enum import Enum


# -------------------- Status Enums --------------------
class InvitationStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"


class TemplateStatus(str, Enum):
    DRAFT = "draft"


# -------------------- Font --------------------
class FontBase(BaseModel):
    label: str
    value: str
    font_family: str
    font_url: str


class FontCreate(FontBase):
    pass


class FontUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    font_family: Optional[str] = None
    font_url: Optional[str] = None

    class Config:
        extra = "forbid"


class FontRead(FontBase):
    id: int

    model_config = {"from_attributes": True}


# -------------------- Guest --------------------
class GuestBase(BaseModel):
    first_name: str
    last_name: str
    guest_type: str
    is_main_guest: bool = False
    menu_choice: Optional[str] = None
    main_guest_id: Optional[int] = None
    attending: bool = False
    created_at: Optional[datetime] = None


class GuestCreate(GuestBase):
    sub_guests: Optional[List["GuestCreate"]] = None


class SubGuestRead(GuestBase):
    id: int
    full_name: Optional[str] = None

    model_config = {"from_attributes": True}


class GuestRead(GuestBase):
    id: int
    full_name: Optional[str] = None
    sub_guests: Optional[List[SubGuestRead]] = None

    model_config = {"from_attributes": True}


# -------------------- Pagination --------------------
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    total_count: int
    current_page: int
    page_size: int
    total_pages: int
    items: List[T]


# -------------------- RSVP --------------------
class RSVPBase(BaseModel):
    ask_menu: bool = False


class RSVPCreate(RSVPBase):
    guests: Optional[List[GuestCreate]] = None


class RSVPRead(RSVPBase):
    id: int
    guests: Optional[List[GuestRead]] = None

    model_config = {"from_attributes": True}


class Stats(BaseModel):
    total_guests: int
    total_attending: int
    total_not_attending: int
    total_adults: int
    total_kids: int
    menu_counts: Dict[str, int] = {}


class RSVPWithStats(BaseModel):
    id: int
    guests: PaginatedResponse[GuestRead]
    ask_menu: bool
    stats: Stats


class RSVPInvitationUpdate(BaseModel):
    ask_menu: bool


class RSVPInvitationRead(BaseModel):
    id: int
    ask_menu: bool

    model_config = {"from_attributes": True}


# -------------------- Category / SubCategory --------------------
class SubCategoryVariantRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

class SubCategoryRead(BaseModel):
    id: int
    name: str
    variants: Optional[List[SubCategoryVariantRead]] = []
    model_config = {"from_attributes": True}

class CategoryRead(BaseModel):
    id: int
    name: str
    subcategories: Optional[List[SubCategoryRead]] = []
    model_config = {"from_attributes": True}

class SubCategoryTemplateRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

class CategoryTemplateRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

class CategoriesResponse(BaseModel):
    categories: List[CategoryRead]
    subcategories: List[SubCategoryRead]
    variants: List[SubCategoryVariantRead]


# -------------------- Game / Slideshow --------------------
class GameRead(BaseModel):
    id: int
    name: str
    key: str
    presentation_image: Optional[str] = None
    model_config = {"from_attributes": True}


class SlideshowRead(BaseModel):
    id: int
    name: str
    key: str
    presentation_image: Optional[str] = None
    model_config = {"from_attributes": True}


# -------------------- Slideshow Image --------------------
class SlideshowImageBase(BaseModel):
    file_url: str
    order: Optional[int] = 0
    slideshow_id: int
    invitation_id: Optional[int] = None
    template_id: Optional[int] = None 


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
    finish_datetime: Optional[datetime] = None
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

    # Optional features (keys)
    selected_game: Optional[str] = None
    selected_game_obj: Optional[GameRead] = None
    selected_slideshow: Optional[str] = None
    selected_slideshow_obj: Optional[SlideshowRead] = None
    selected_font: Optional[str] = None
    font_obj: Optional[FontRead] = None

    # Styling / Media
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    wallpaper: Optional[str] = None
    background_audio: Optional[str] = None

    # Ownership / session
    owner_id: Optional[int] = None
    anon_session_id: Optional[str] = None
    preview_token: Optional[str] = None

    # Activation
    active_from: Optional[datetime] = None
    active_until: Optional[datetime] = None
    is_active: Optional[bool] = False

    # Category / template
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    template_id: Optional[int] = None


class InvitationCreate(InvitationBase):
    rsvp: RSVPCreate
    events: Annotated[List[EventCreate], Field(min_length=1)]
    slideshow_images: Optional[List[SlideshowImageCreate]] = None


class InvitationUpdate(InvitationBase):
    rsvp: Optional[RSVPInvitationUpdate] = None
    events: Optional[List[EventUpdate]] = None
    slideshow_images: Optional[List[SlideshowImageCreate]] = None
    selected_font: Optional[str] = None

    class Config:
        extra = "forbid"


class InvitationRead(InvitationBase):
    id: int
    status: Optional[InvitationStatus]
    rsvp: RSVPInvitationRead
    events: List[EventRead] = []
    slideshow_images: List[SlideshowImageRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReadyToPurchaseResponse(BaseModel):
    ready: bool
    missing: List[str] | None = None


# -------------------- Template --------------------
class TemplateBase(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    extra_info: Optional[str] = None

    # Optional features (keys)
    selected_game: Optional[str] = None
    selected_game_obj: Optional[GameRead] = None
    selected_slideshow: Optional[str] = None
    selected_slideshow_obj: Optional[SlideshowRead] = None
    selected_font: Optional[str] = None
    font_obj: Optional[FontRead] = None

    # Styling / Media
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    wallpaper: Optional[str] = None
    background_audio: Optional[str] = None

    # Categories
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    subcategory_variant_id: Optional[int] = None

    # Public availability
    is_released: Optional[bool] = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(TemplateBase):
    pass


class TemplateRead(TemplateBase):
    id: int
    status: Optional[TemplateStatus] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryTemplateRead] = None
    subcategory: Optional[SubCategoryTemplateRead] = None
    subcategory_variant: Optional[SubCategoryVariantRead] = None
    slideshow_images: List[SlideshowImageRead] = []

    model_config = {"from_attributes": True}
