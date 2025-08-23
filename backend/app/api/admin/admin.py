from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.services.auth import authenticate_user, create_session
from app.db.session import get_read_session

router = APIRouter()

SESSION_EXPIRE_SECONDS = int(os.getenv("SESSION_EXPIRE_SECONDS", 604800))
ADMIN_SESSION_COOKIE_NAME = os.getenv("ADMIN_SESSION_COOKIE_NAME", "admin_session_id")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SESSION_COOKIE_SECURE = ENVIRONMENT == "production"

templates = Jinja2Templates(directory="app/templates")


@router.get("/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    return templates.TemplateResponse("admin/dashboard.html", {"request": request})


@router.get("/login", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    return templates.TemplateResponse("admin/login.html", {"request": request})


@router.post("/login", response_class=HTMLResponse)
async def admin_login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db_read: AsyncSession = Depends(get_read_session),
):
    user = await authenticate_user(email, password, db_read)
    if not user or user.role != "admin":
        return templates.TemplateResponse(
            "admin/login.html",
            {"request": request, "error": "Невалиден админ акаунт или парола"},
        )

    session_id = await create_session(user)

    response = RedirectResponse(url="/admin/dashboard", status_code=302)
    response.set_cookie(
        key=ADMIN_SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        max_age=SESSION_EXPIRE_SECONDS,
        path="/",
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
    )
    return response


@router.get("/logout")
async def admin_logout():
    response = RedirectResponse(url="/admin/login", status_code=302)
    response.delete_cookie(
        key=ADMIN_SESSION_COOKIE_NAME,
        path="/",
    )
    return response
