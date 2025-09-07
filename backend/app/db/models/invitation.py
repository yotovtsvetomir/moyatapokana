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
from sqlalchemy.orm import relationship, declared_attr
from app.db.session import Base

# -------------------- Enums --------------------
class InvitationStatus(PyEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"

class TemplateStatus(PyEnum):
    DRAFT = "draft"

# -------------------- Shared Base --------------------
class InvitationTemplateBase:
    @declared_attr
    def title(cls):
        return Column(String, nullable=False)

    @declared_attr
    def slug(cls):
        return Column(String, unique=True, nullable=True)

    @declared_attr
    def description(cls):
        return Column(Text, nullable=True)

    @declared_attr
    def extra_info(cls):
        return Column(Text, nullable=True)

    # Optional features
    @declared_attr
    def selected_game(cls):
        return Column(String, nullable=True)

    @declared_attr
    def selected_slideshow(cls):
        return Column(String, nullable=True)

    @declared_attr
    def selected_font(cls):
        return Column(String, nullable=True)

    # Styling / Media
    @declared_attr
    def primary_color(cls):
        return Column(String, nullable=True)

    @declared_attr
    def secondary_color(cls):
        return Column(String, nullable=True)

    @declared_attr
    def wallpaper(cls):
        return Column(String, nullable=True)

    @declared_attr
    def background_audio(cls):
        return Column(String, nullable=True)

    # New field for video
    @declared_attr
    def video_file(cls):
        return Column(String, nullable=True)

    # Relationships
    @declared_attr
    def font_obj(cls):
        return relationship(
            "Font",
            primaryjoin=f"foreign({cls.__name__}.selected_font) == Font.value",
            viewonly=True,
        )

    @declared_attr
    def selected_game_obj(cls):
        return relationship(
            "Game",
            primaryjoin=f"foreign({cls.__name__}.selected_game) == Game.key",
            viewonly=True,
        )

    @declared_attr
    def selected_slideshow_obj(cls):
        return relationship(
            "Slideshow",
            primaryjoin=f"foreign({cls.__name__}.selected_slideshow) == Slideshow.key",
            viewonly=True,
        )

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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

    def __str__(self):
        return self.name

class SubCategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    category = relationship("Category")
    templates = relationship("Template", back_populates="subcategory")

# -------------------- Games / Slideshows --------------------
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    video = Column(String, nullable=True)

    def __str__(self):
        return self.name

class Slideshow(Base):
    __tablename__ = "slideshows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, nullable=False)
    video = Column(String, nullable=True)
    images = relationship(
        "SlideshowImage", back_populates="slideshow", cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.name

class SlideshowImage(Base):
    __tablename__ = "slideshow_images"

    id = Column(Integer, primary_key=True, index=True)

    # Make both foreign keys nullable
    invitation_id = Column(Integer, ForeignKey("invitations.id", ondelete="CASCADE"), nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=True)

    slideshow_id = Column(Integer, ForeignKey("slideshows.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String, nullable=False)
    order = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invitation = relationship("Invitation", back_populates="slideshow_images")
    template = relationship("Template", back_populates="slideshow_images")
    slideshow = relationship("Slideshow", back_populates="images")

    def __str__(self):
        return self.file_url


# -------------------- Template --------------------
class Template(Base, InvitationTemplateBase):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(TemplateStatus), default=TemplateStatus.DRAFT)
    is_released = Column(Boolean, default=False)

    slideshow_images = relationship(
        "SlideshowImage",
        back_populates="template",
        cascade="all, delete-orphan"
    )

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    category = relationship("Category", back_populates="templates")
    subcategory = relationship("SubCategory", back_populates="templates")


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
class Invitation(Base, InvitationTemplateBase):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.DRAFT)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    anon_session_id = Column(String, nullable=True)
    preview_token = Column(String, unique=True, nullable=True)

    active_from = Column(DateTime, nullable=True)
    active_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False)

    rsvp_id = Column(Integer, ForeignKey("rsvps.id", ondelete="CASCADE"), nullable=False, unique=True)
    rsvp = relationship("RSVP", back_populates="invitation")

    slideshow_images = relationship(
        "SlideshowImage", back_populates="invitation", cascade="all, delete-orphan"
    )
    events = relationship(
        "Event", back_populates="invitation", cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.title
