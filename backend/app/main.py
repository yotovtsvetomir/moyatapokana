from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware


from app.api.admin.admin import router as admin_router
from app.api.admin.analytics import router as admin_analytics_router
from app.api.admin.templates import router as admin_templates_router
from app.api.admin.slideshows import router as admin_slideshows_router
from app.api.admin.games import router as admin_games_router
from app.api.admin.blogs import router as admin_blogs_router

from app.core.permissions import is_admin_authenticated
from app.api.users.users import router as users_router
from app.api.users.social_auth import router as social_router
from app.api.invitations.invitations import router as invitations_router
from app.api.orders.orders import router as orders_router
from app.api.blogs.blogs import router as blogs_router

from app.admin import setup_admin

app = FastAPI()


class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/admin/login":
            return await call_next(request)

        if request.url.path.startswith("/admin"):
            try:
                await is_admin_authenticated(request.cookies.get("admin_session_id"))
            except Exception:
                return RedirectResponse(url="/admin/login")

        return await call_next(request)


# Middleware
app.add_middleware(SessionMiddleware, secret_key="your-secret-key")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Users Routers
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(social_router, prefix="/users", tags=["users"])

# Admin Routers
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(admin_analytics_router, prefix="/admin", tags=["admin"])
app.include_router(admin_templates_router, prefix="/admin/templates", tags=["admin"])
app.include_router(admin_slideshows_router, prefix="/admin/slideshows", tags=["admin"])
app.include_router(admin_games_router, prefix="/admin/games", tags=["admin"])
app.include_router(admin_blogs_router, prefix="/admin/blogs", tags=["admin"])

# Invitations Routers
app.include_router(invitations_router, prefix="/invitations", tags=["invitations"])

# Orders Routers
app.include_router(orders_router, prefix="/orders", tags=["Orders"])

# Blogposts routers
app.include_router(blogs_router, prefix="/blogposts", tags=["Blogposts"])

# Add middleware after routers
app.add_middleware(AdminAuthMiddleware)

# Setup SQLAdmin
setup_admin(app)
