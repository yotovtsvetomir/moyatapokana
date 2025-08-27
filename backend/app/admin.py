from sqladmin import Admin, ModelView
from app.db.session import engine_writer, get_read_session, get_write_session
from app.db.models.user import User
from app.db.models.invitation import Game, Slideshow  # import models


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


# -------------------- Setup Admin --------------------
def setup_admin(app):
    admin = Admin(
        app,
        engine_writer,
        title="Moyata Pokana Admin",
    )
    admin.add_view(UserAdmin)
    admin.add_view(GameAdmin)
    admin.add_view(SlideshowAdmin)
