from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    Boolean,
    Computed,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


# -------------------- Enums --------------------
class InvitationStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"


class TemplateStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"


# -------------------- Fonts --------------------
class Font(Base):
    __tablename__ = "fonts"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(100), nullable=False)
    value = Column(String(100), nullable=False, unique=True)
    font_family = Column(String(100), nullable=False)
    font_url = Column(String, nullable=False)

    def __str__(self):
        return self.label


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


# -------------------- Games / Slideshows --------------------
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)

    def __str__(self):
        return self.name


class Slideshow(Base):
    __tablename__ = "slideshows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    images = relationship(
        "SlideshowImage", back_populates="slideshow", cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.name


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

    invitation = relationship("Invitation", back_populates="slideshow_images")
    slideshow = relationship("Slideshow", back_populates="images")

    def __str__(self):
        return self.file_url


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
    selected_font = Column(String, nullable=True)

    # Styling / Media
    primary_color = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    wallpaper = Column(String, nullable=True)
    background_audio = Column(String, nullable=True)

    font_obj = relationship(
        "Font",
        primaryjoin="foreign(Template.selected_font) == Font.value",
        viewonly=True,
    )

    # Relationships to catalog objects
    selected_game_obj = relationship(
        "Game",
        primaryjoin="foreign(Template.selected_game) == Game.key",
        viewonly=True,
    )
    selected_slideshow_obj = relationship(
        "Slideshow",
        primaryjoin="foreign(Template.selected_slideshow) == Slideshow.key",
        viewonly=True,
    )

    # Categories
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    category = relationship("Category", back_populates="templates")
    subcategory = relationship("SubCategory", back_populates="templates")

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

    def __str__(self):
        return f"RSVP #{self.id}"


class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True)
    rsvp_id = Column(Integer, ForeignKey("rsvps.id"), nullable=False)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    guest_type = Column(String, nullable=False)
    is_main_guest = Column(Boolean, default=False)
    menu_choice = Column(String, nullable=True)
    attending = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    full_name = Column(Text, Computed("first_name || ' ' || last_name", persisted=True))

    rsvp = relationship("RSVP", back_populates="guests")

    main_guest_id = Column(Integer, ForeignKey("guests.id"), nullable=True)
    main_guest = relationship("Guest", remote_side=[id], backref="sub_guests")

    def __str__(self):
        return f"Guest #{self.id}, {self.first_name} {self.last_name}"


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

    def __str__(self):
        return self.title


# -------------------- Invitation --------------------
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
    selected_font = Column(String, nullable=True)

    # Styling / Media
    primary_color = Column(String, nullable=True)
    secondary_color = Column(String, nullable=True)
    wallpaper = Column(String, nullable=True)
    background_audio = Column(String, nullable=True)

    font_obj = relationship(
        "Font",
        primaryjoin="foreign(Invitation.selected_font) == Font.value",
        viewonly=True,
    )

    # Relationships to catalog objects
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

    slideshow_images = relationship(
        "SlideshowImage", back_populates="invitation", cascade="all, delete-orphan"
    )

    events = relationship(
        "Event", back_populates="invitation", cascade="all, delete-orphan"
    )

    # Ownership
    owner_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
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
    rsvp = relationship("RSVP", back_populates="invitation")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __str__(self):
        return self.title
