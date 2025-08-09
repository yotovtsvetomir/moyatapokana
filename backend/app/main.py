from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.users.users import router as users_router
from app.api.users.admin import router as admin_router
from app.api.users.social_auth import router as social_router

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key="your-secret-key")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(admin_router, prefix="/users", tags=["users"])
app.include_router(social_router, prefix="/users", tags=["users"])
