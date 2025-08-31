from sqladmin import Admin, ModelView
from app.db.session import engine_writer, get_read_session, get_write_session
from app.db.models.user import User
from app.db.models.invitation import Game, Slideshow, Invitation, RSVP, Guest


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
    ]
    column_searchable_list = [
        Invitation.title,
        Invitation.slug,
        Invitation.owner_id,
    ]
    column_sortable_list = [
        Invitation.id,
        Invitation.title,
        Invitation.active_from,
        Invitation.active_until,
    ]
    column_editable_list = [
        Invitation.title,
        Invitation.slug,
        Invitation.is_active,
        Invitation.active_from,
        Invitation.active_until,
    ]

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = Invitation(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(Invitation, int(pk))
            if not db_obj:
                return None
            allowed_fields = ["status", "is_active", "active_from", "active_until"]
            for key in allowed_fields:
                if key in data:
                    setattr(db_obj, key, data[key])
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
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
    column_searchable_list = [RSVP.id]  # Customize if needed
    column_sortable_list = [RSVP.id]
    column_editable_list = [RSVP.ask_menu]

    # Optional: if you want to show guests as a relation
    column_formatters = {
        "guests": lambda rsvp: ", ".join(
            [guest.name for guest in getattr(rsvp, "guests", [])]
        )
    }

    async def get_session(self):
        async for session in get_read_session():
            return session

    async def create_model(self, session, data):
        async for s in get_write_session():
            obj = RSVP(**data)
            s.add(obj)
            await s.commit()
            await s.refresh(obj)
            return obj

    async def update_model(self, session, pk, data):
        async for s in get_write_session():
            db_obj = await s.get(RSVP, int(pk))
            if not db_obj:
                return None
            allowed_fields = ["ask_menu"]
            for key in allowed_fields:
                if key in data:
                    setattr(db_obj, key, data[key])
            s.add(db_obj)
            await s.commit()
            await s.refresh(db_obj)
            return db_obj

    async def delete_model(self, session, pk):
        async for s in get_write_session():
            db_obj = await s.get(RSVP, int(pk))
            if not db_obj:
                return None
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
            db_obj = await s.get(Guest, int(pk))
            if not db_obj:
                return None

            # Reset sub-guests if deleting a main guest
            for sub in db_obj.sub_guests:
                sub.main_guest_id = None
                s.add(sub)

            await s.delete(db_obj)
            await s.commit()
            return db_obj


# -------------------- Setup Admin --------------------
def setup_admin(app):
    admin = Admin(
        app,
        engine_writer,
        title="Moyata Pokana Admin",
    )
    admin.add_view(UserAdmin)
    admin.add_view(InvitationAdmin)
    admin.add_view(GameAdmin)
    admin.add_view(SlideshowAdmin)
    admin.add_view(RSVPAdmin)
    admin.add_view(GuestAdmin)
