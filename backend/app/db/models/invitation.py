from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from app.db.session import Base


# -------------------- Status Enums --------------------
class InvitationStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"


class TemplateStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"


# -------------------- Category / SubCategory --------------------
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    templates = relationship("Template", back_populates="category")


class SubCategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    templates = relationship("Template", back_populates="subcategory")


# -------------------- Template --------------------
class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    description = Column(Text, nullable=True)
    extra_info = Column(Text, nullable=True)
    status = Column(Enum(TemplateStatus), default=TemplateStatus.DRAFT)

    # Optional features (store keys)
    selected_game = Column(String, nullable=True)
    selected_slideshow = Column(String, nullable=True)

    # Styling / Media
    primary_color = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    wallpaper = Column(String, nullable=True)
    background_audio = Column(String, nullable=True)
    font = Column(String, nullable=True)

    # Categories
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    category = relationship("Category", back_populates="templates")
    subcategory = relationship("SubCategory", back_populates="templates")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -------------------- Games / Slideshows --------------------
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)


class Slideshow(Base):
    __tablename__ = "slideshows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    images = relationship(
        "SlideshowImage", back_populates="slideshow", cascade="all, delete-orphan"
    )


# -------------------- Invitations --------------------
class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    description = Column(Text, nullable=True)
    extra_info = Column(Text, nullable=True)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.DRAFT)

    # Optional features (store keys)
    selected_game = Column(String, nullable=True)
    selected_slideshow = Column(String, nullable=True)

    # Relationships to catalog
    selected_game_obj = relationship(
        "Game",
        primaryjoin="foreign(Invitation.selected_game) == Game.key",
        viewonly=True,
    )
    selected_slideshow_obj = relationship(
        "Slideshow",
        primaryjoin="foreign(Invitation.selected_slideshow) == Slideshow.key",
        viewonly=True,
    )

    # Styling / Media
    primary_color = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    wallpaper = Column(String, nullable=True)
    background_audio = Column(String, nullable=True)
    font = Column(String, nullable=True)

    slideshow_images = relationship(
        "SlideshowImage", back_populates="invitation", cascade="all, delete-orphan"
    )

    # Events
    events = relationship(
        "Event", back_populates="invitation", cascade="all, delete-orphan"
    )

    # Template reference
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    template = relationship("Template", viewonly=True)

    # Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    anon_session_id = Column(String, nullable=True)

    # Guest preview / activation
    preview_token = Column(String, unique=True, nullable=True)

    # Purchasing
    active_from = Column(DateTime, nullable=True)
    active_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False)

    # RSVP
    rsvp_id = Column(
        Integer, ForeignKey("rsvps.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    rsvp = relationship(
        "RSVP",
        back_populates="invitation",
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -------------------- RSVP / Guest --------------------
class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True)
    ask_menu = Column(Boolean, default=False)
    invitation = relationship("Invitation", uselist=False, back_populates="rsvp")
    guests = relationship("Guest", back_populates="rsvp", cascade="all, delete-orphan")


class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True)
    rsvp_id = Column(Integer, ForeignKey("rsvps.id"), nullable=False)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    guest_type = Column(String, nullable=False)
    is_main_guest = Column(Boolean, default=False)
    menu_choice = Column(String, nullable=True)

    rsvp = relationship("RSVP", back_populates="guests")


# -------------------- Event --------------------
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(
        Integer, ForeignKey("invitations.id", ondelete="CASCADE"), nullable=False
    )

    title = Column(String, nullable=False)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    finish_datetime = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    calendar_link = Column(String, nullable=True)
    location_link = Column(String, nullable=True)

    invitation = relationship("Invitation", back_populates="events")


# -------------------- Slideshow Images --------------------
class SlideshowImage(Base):
    __tablename__ = "slideshow_images"

    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(
        Integer, ForeignKey("invitations.id", ondelete="CASCADE"), nullable=False
    )
    slideshow_id = Column(
        Integer, ForeignKey("slideshows.id", ondelete="CASCADE"), nullable=False
    )
    file_url = Column(String, nullable=False)
    order = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    invitation = relationship("Invitation", back_populates="slideshow_images")
    slideshow = relationship("Slideshow", back_populates="images")
