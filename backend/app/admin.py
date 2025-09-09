import string
import random
from sqlalchemy import event
from sqladmin import Admin, ModelView
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import engine_writer, get_read_session, get_write_session
from app.db.models.user import User, DailyUserStats
from app.db.models.invitation import (
    Game,
    Slideshow,
    Invitation,
    RSVP,
    Guest,
    Font,
    Event,
    Category,
    SubCategory
)
from app.db.models.order import PriceTier, Order, Voucher, CurrencyRate


# -------------------- User Admin --------------------
class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.first_name, User.last_name, User.role]
    column_searchable_list = [User.email, User.first_name, User.last_name, User.role]
    column_sortable_list = [User.id, User.email, User.first_name, User.role]
    column_editable_list = [User.email, User.first_name, User.last_name]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = User(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(User, int(pk))
            if not db_obj:
                return None
            allowed_fields = ["email", "first_name", "last_name"]
            for key in allowed_fields:
                if key in data:
                    setattr(db_obj, key, data[key])
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(User, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- Game Admin --------------------
class GameAdmin(ModelView, model=Game):
    column_list = [Game.id, Game.name, Game.key]
    column_searchable_list = [Game.name, Game.key]
    column_sortable_list = [Game.id, Game.name]
    column_editable_list = [Game.name, Game.key]

    async def get_session(self):
        async for session in get_read_session():
            return session


# -------------------- Slideshow Admin --------------------
class SlideshowAdmin(ModelView, model=Slideshow):
    column_list = [Slideshow.id, Slideshow.name, Slideshow.key]
    column_searchable_list = [Slideshow.name, Slideshow.key]
    column_sortable_list = [Slideshow.id, Slideshow.name]
    column_editable_list = [Slideshow.name, Slideshow.key]
    form_excluded_columns = ["images"]

    async def get_session(self):
        async for session in get_read_session():
            return session


# -------------------- Invitation Admin --------------------
class InvitationAdmin(ModelView, model=Invitation):
    column_list = [
        Invitation.id,
        Invitation.title,
        Invitation.slug,
        Invitation.owner_id,
        Invitation.is_active,
        Invitation.active_from,
        Invitation.active_until,
        Invitation.rsvp_id,
    ]
    column_searchable_list = [Invitation.title, Invitation.slug, Invitation.owner_id]
    column_sortable_list = [
        Invitation.id,
        Invitation.title,
        Invitation.active_from,
        Invitation.active_until,
        Invitation.rsvp_id,
    ]
    column_editable_list = [
        Invitation.title,
        Invitation.slug,
        Invitation.is_active,
        Invitation.active_from,
        Invitation.active_until,
        Invitation.rsvp_id,
    ]

    form_ajax_refs = {
        "rsvp": {"fields": (RSVP.id, RSVP.ask_menu)},
        "slideshow_images": {"fields": ("file_url",)},
        "events": {"fields": ("title",)},
    }

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = Invitation(
                **{
                    k: v
                    for k, v in data.items()
                    if k in Invitation.__table__.columns.keys()
                }
            )
            s.add(obj)
            await s.commit()
            # Refresh only scalar fields, not relationships
            await s.refresh(
                obj,
                attribute_names=[
                    "id",
                    "title",
                    "slug",
                    "owner_id",
                    "is_active",
                    "active_from",
                    "active_until",
                    "rsvp_id",
                ],
            )
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Invitation, int(pk))
            if not db_obj:
                return None
            allowed_keys = Invitation.__table__.columns.keys()
            for key, value in data.items():
                if key in allowed_keys:
                    setattr(db_obj, key, value)
            s.add(db_obj)
            await s.commit()
            await s.refresh(
                db_obj,
                attribute_names=[
                    "id",
                    "title",
                    "slug",
                    "owner_id",
                    "is_active",
                    "active_from",
                    "active_until",
                    "rsvp_id",
                ],
            )
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(Invitation, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- RSVP Admin --------------------
class RSVPAdmin(ModelView, model=RSVP):
    column_list = [RSVP.id, RSVP.ask_menu]
    column_searchable_list = [RSVP.id]
    column_sortable_list = [RSVP.id]
    column_editable_list = [RSVP.ask_menu]

    # Show guests for this RSVP only
    column_formatters = {
        "guests": lambda v, c, m, n: ", ".join(
            [
                guest.first_name + " " + guest.last_name
                for guest in getattr(m, "guests", [])
            ]
        )
    }

    # -------------------- AJAX multiple selection for guests --------------------
    form_ajax_refs = {
        "guests": {
            "fields": (Guest.first_name, Guest.last_name),
            # Filter guests by RSVP ID dynamically
            "filters": lambda query: query.filter(
                Guest.rsvp_id == getattr(query._model, "id", None)
            ),
        }
    }

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = RSVP(**data)
            # Optionally assign guests
            guest_ids = data.get("guests", [])
            for guest_id in guest_ids:
                guest = await s.get(Guest, int(guest_id))
                if guest:
                    guest.rsvp_id = obj.id
                    s.add(guest)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(RSVP, int(pk))
            if not db_obj:
                return None
            if "ask_menu" in data:
                db_obj.ask_menu = data["ask_menu"]

            # Update guests
            if "guests" in data:
                guest_ids = data["guests"]
                # Remove old guests not in new selection
                for g in db_obj.guests:
                    if g.id not in guest_ids:
                        g.rsvp_id = None
                        s.add(g)
                # Assign new guests
                for guest_id in guest_ids:
                    guest = await s.get(Guest, int(guest_id))
                    if guest:
                        guest.rsvp_id = db_obj.id
                        s.add(guest)

            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(RSVP, int(pk))
            if not db_obj:
                return None
            # Reset guests
            for guest in db_obj.guests:
                guest.rsvp_id = None
                s.add(guest)
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- Guest Admin --------------------
class GuestAdmin(ModelView, model=Guest):
    column_list = [
        Guest.id,
        Guest.first_name,
        Guest.last_name,
        Guest.guest_type,
        Guest.is_main_guest,
        Guest.menu_choice,
        Guest.rsvp_id,
        Guest.main_guest_id,
    ]

    column_searchable_list = [
        Guest.first_name,
        Guest.last_name,
        Guest.guest_type,
        Guest.rsvp_id,
    ]

    column_sortable_list = [
        Guest.id,
        Guest.first_name,
        Guest.last_name,
        Guest.main_guest_id,
    ]

    column_editable_list = [
        Guest.first_name,
        Guest.last_name,
        Guest.guest_type,
        Guest.menu_choice,
        Guest.is_main_guest,
        Guest.rsvp_id,
        Guest.main_guest_id,
    ]

    column_formatters = {
        "sub_guests": lambda v, c, m, n: ", ".join(
            f"{g.first_name} {g.last_name}" for g in m.sub_guests
        )
        or "-"
    }

    column_labels = {"sub_guests": "Sub Guests"}

    # -------------------- AJAX multiple selection for sub-guests --------------------
    form_ajax_refs = {
        "main_guest": {
            "fields": (Guest.first_name, Guest.last_name),
            "filters": lambda query: query.filter(Guest.is_main_guest),
        },
        "sub_guests": {  # multiple-selection for editing sub-guests
            "fields": (Guest.first_name, Guest.last_name),
            "filters": lambda query: query.filter(not Guest.is_main_guest),
        },
    }

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def on_model_change(self, data, model, is_created, request):
        """
        Update the `main_guest_id` for all selected sub-guests.
        """
        # `data` is a dict with form values
        sub_guest_ids = data.get("sub_guests", [])

        if not sub_guest_ids:
            sub_guest_ids = []

        # Reset old sub-guests
        for sub in model.sub_guests:
            if sub.id not in sub_guest_ids:
                sub.main_guest_id = None

        # Assign new sub-guests
        for sub_id in sub_guest_ids:
            # async get session here
            async for s in get_write_session():
                sub_guest = await s.get(Guest, int(sub_id))
                if sub_guest:
                    sub_guest.main_guest_id = model.id
                    s.add(sub_guest)
                    await s.commit()

    # -------------------- Helper --------------------
    async def _set_main_guest(self, obj, value, session):
        if not value:
            obj.main_guest_id = None
            return

        main_id = (
            int(value["id"])
            if isinstance(value, dict) and "id" in value
            else int(value)
        )
        main_guest = await session.get(Guest, main_id)

        if (
            not main_guest
            or not main_guest.is_main_guest
            or main_guest.rsvp_id != obj.rsvp_id
        ):
            raise ValueError(
                "main_guest_id must point to a valid main guest in the same RSVP"
            )

        if obj.is_main_guest:
            raise ValueError("A main guest cannot have a main_guest_id set")

        obj.main_guest_id = main_id

    # -------------------- Create / Update --------------------
    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = Guest()
            columns = Guest.__table__.columns.keys()

            for key, value in data.items():
                if key not in columns and key not in ["rsvp", "main_guest"]:
                    continue

                if key in ["rsvp", "rsvp_id"]:
                    obj.rsvp_id = int(value) if value else None
                elif key in ["main_guest", "main_guest_id"]:
                    await self._set_main_guest(obj, value, s)
                else:
                    setattr(obj, key, value)

            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Guest, int(pk))
            if not db_obj:
                return None

            columns = Guest.__table__.columns.keys()
            for key, value in data.items():
                if key not in columns and key not in ["rsvp", "main_guest"]:
                    continue

                if key in ["rsvp", "rsvp_id"]:
                    db_obj.rsvp_id = int(value) if value else None
                elif key in ["main_guest", "main_guest_id"]:
                    await self._set_main_guest(db_obj, value, s)
                else:
                    setattr(db_obj, key, value)

            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    # -------------------- Delete --------------------
    async def delete_model(self, session, pk):
        async for s in get_write_session():
            result = await s.execute(
                select(Guest)
                .where(Guest.id == int(pk))
                .options(selectinload(Guest.sub_guests))  # load sub_guests eagerly
            )
            db_obj = result.scalars().first()
            if not db_obj:
                return None

            # Reset sub-guests
            for sub in db_obj.sub_guests:
                sub.main_guest_id = None
                s.add(sub)

            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- Font Admin --------------------
class FontAdmin(ModelView, model=Font):
    column_list = [Font.id, Font.label, Font.value, Font.font_family, Font.font_url]
    column_searchable_list = [Font.label, Font.value, Font.font_family]
    column_sortable_list = [Font.id, Font.label, Font.value]
    column_editable_list = [Font.label, Font.value, Font.font_family, Font.font_url]
    form_excluded_columns = ["invitations", "templates"]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            # Exclude relationships
            allowed_keys = set(Font.__table__.columns.keys())
            filtered_data = {k: v for k, v in data.items() if k in allowed_keys}

            obj = Font(**filtered_data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Font, int(pk))
            if not db_obj:
                return None

            allowed_keys = set(Font.__table__.columns.keys())
            for key, value in data.items():
                if key in allowed_keys:
                    setattr(db_obj, key, value)

            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(Font, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- PriceTier Admin --------------------
class PriceTierAdmin(ModelView, model=PriceTier):
    column_list = [
        PriceTier.id,
        PriceTier.price,
        PriceTier.duration_days,
        PriceTier.currency,
        PriceTier.active,
    ]

    column_searchable_list = [PriceTier.currency]
    column_sortable_list = [PriceTier.id, PriceTier.price, PriceTier.duration_days]
    column_editable_list = [PriceTier.price, PriceTier.active]
    form_excluded_columns = ["orders"]


def generate_voucher_code(blocks=4, block_length=5):
        """Generates a voucher code in the format XXXXX-XXXXX-XXXXX-XXXXX."""
        chars = string.ascii_uppercase + string.digits
        return '-'.join(''.join(random.choices(chars, k=block_length)) for _ in range(blocks))

# -------------------- Voucher Admin --------------------
class VoucherAdmin(ModelView, model=Voucher):
    column_list = [
        Voucher.id,
        Voucher.code,
        Voucher.discount_type,
        Voucher.amount,
        Voucher.active,
        Voucher.usage_limit,
        Voucher.used_count,
    ]

    column_searchable_list = [Voucher.code]
    column_sortable_list = [Voucher.id, Voucher.code, Voucher.amount, Voucher.active]
    column_editable_list = [Voucher.amount, Voucher.active, Voucher.usage_limit]
    form_excluded_columns = ["orders", "code"]


    # Event listener for auto-generating code
    @event.listens_for(Voucher, "before_insert")
    def auto_generate_voucher_code(mapper, connection, target):
        if not target.code:  # Only generate if no code is provided
            # Ensure uniqueness (basic approach)
            while True:
                new_code = generate_voucher_code()
                # Check if code already exists
                existing = connection.execute(
                    Voucher.__table__.select().where(Voucher.code == new_code)
                ).first()
                if not existing:
                    break
            target.code = new_code


# -------------------- Order Admin --------------------
class OrderAdmin(ModelView, model=Order):
    column_list = [
        Order.id,
        Order.order_number,
        Order.customer_name,
        Order.customer_email,
        Order.total_price,
        Order.paid,
        Order.status,
        Order.invitation_id,
        Order.voucher_id,
        Order.price_tier_id,
        Order.created_at,
        Order.updated_at,
    ]

    column_searchable_list = [
        Order.order_number,
        Order.customer_name,
        Order.customer_email,
    ]
    column_sortable_list = [
        Order.id,
        Order.order_number,
        Order.total_price,
        Order.paid,
        Order.status,
    ]
    column_editable_list = [
        Order.customer_name,
        Order.customer_email,
        Order.paid,
        Order.status,
    ]

    # -------------------- AJAX references --------------------
    form_ajax_refs = {
        "invitation": {
            "fields": (Invitation.title,),
        },
        "voucher": {
            "fields": (Voucher.code,),
        },
        "price_tier": {
            "fields": (PriceTier.price,),
        },
    }

    async def get_session(self):
        async for session in get_read_session():
            return session


class CurrencyRateAdmin(ModelView, model=CurrencyRate):
    column_list = [
        CurrencyRate.id,
        CurrencyRate.currency,
        CurrencyRate.rate_to_bgn,
        CurrencyRate.updated_at,
    ]

    column_searchable_list = [CurrencyRate.currency]
    column_sortable_list = [
        CurrencyRate.id,
        CurrencyRate.currency,
        CurrencyRate.updated_at,
    ]
    column_editable_list = [CurrencyRate.rate_to_bgn]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            allowed_keys = set(CurrencyRate.__table__.columns.keys())
            filtered_data = {k: v for k, v in data.items() if k in allowed_keys}
            obj = CurrencyRate(**filtered_data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(CurrencyRate, int(pk))
            if not db_obj:
                return None
            allowed_keys = set(CurrencyRate.__table__.columns.keys())
            for key, value in data.items():
                if key in allowed_keys:
                    setattr(db_obj, key, value)
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(CurrencyRate, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


class EventAdmin(ModelView, model=Event):
    column_list = [
        Event.id,
        Event.title,
        Event.invitation_id,
        Event.start_datetime,
        Event.finish_datetime,
        Event.location,
    ]
    column_searchable_list = [Event.title, Event.location]
    column_sortable_list = [Event.id, Event.start_datetime, Event.finish_datetime]
    column_editable_list = [
        Event.title,
        Event.start_datetime,
        Event.finish_datetime,
        Event.location,
        Event.description,
    ]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = Event(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Event, int(pk))
            if not db_obj:
                return None
            for key, value in data.items():
                if hasattr(db_obj, key):
                    setattr(db_obj, key, value)
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(Event, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- Category Admin --------------------
class CategoryAdmin(ModelView, model=Category):
    column_list = [Category.id, Category.name]
    column_searchable_list = [Category.name]
    column_sortable_list = [Category.id, Category.name]
    column_editable_list = [Category.name]
    form_excluded_columns = ["templates"]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = Category(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Category, int(pk))
            if not db_obj:
                return None
            if "name" in data:
                db_obj.name = data["name"]
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(Category, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- SubCategory Admin --------------------
class SubCategoryAdmin(ModelView, model=SubCategory):
    column_list = [SubCategory.id, SubCategory.name, SubCategory.category_id]
    column_searchable_list = [SubCategory.name]
    column_sortable_list = [SubCategory.id, SubCategory.name]
    column_editable_list = [SubCategory.name, SubCategory.category_id]
    form_excluded_columns = ["templates"]

    # Use a dropdown for category selection
    form_ajax_refs = {
        "category": {"fields": (Category.name,)}
    }

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = SubCategory(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(SubCategory, int(pk))
            if not db_obj:
                return None
            if "name" in data:
                db_obj.name = data["name"]
            if "category_id" in data:
                db_obj.category_id = int(data["category_id"])
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(SubCategory, int(pk))
            if not db_obj:
                return None
            await s.delete(db_obj)
            await s.commit()
            return db_obj


class DailyUserStatsAdmin(ModelView, model=DailyUserStats):
    column_list = [DailyUserStats.id, DailyUserStats.date, DailyUserStats.user_type, DailyUserStats.active_count]
    column_searchable_list = [DailyUserStats.user_type]
    column_sortable_list = [DailyUserStats.date, DailyUserStats.active_count]


# -------------------- Setup Admin --------------------
def setup_admin(app):
    admin = Admin(
        app,
        engine_writer,
        title="Moyata Pokana Admin",
    )
    admin.add_view(UserAdmin)
    admin.add_view(DailyUserStatsAdmin)
    admin.add_view(InvitationAdmin)
    admin.add_view(GameAdmin)
    admin.add_view(SlideshowAdmin)
    admin.add_view(RSVPAdmin)
    admin.add_view(GuestAdmin)
    admin.add_view(FontAdmin)
    admin.add_view(PriceTierAdmin)
    admin.add_view(VoucherAdmin)
    admin.add_view(OrderAdmin)
    admin.add_view(CurrencyRateAdmin)
    admin.add_view(EventAdmin)
    admin.add_view(CategoryAdmin)
    admin.add_view(SubCategoryAdmin)
