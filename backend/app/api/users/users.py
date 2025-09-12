import aiodns
from datetime import datetime, timedelta
import uuid
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    Request,
    File,
    UploadFile,
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from app.core.permissions import require_role
from app.core.settings import settings
from app.db.session import get_read_session, get_write_session
from app.db.models.invitation import Invitation, InvitationStatus
from app.db.models.user import User, PasswordResetToken
from app.schemas.user import (
    UserRead,
    UserLogin,
    UserCreate,
    UserUpdate,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services.email import send_email, render_email
from app.services.stats import increment_daily_user_stat
from app.services.s3.profile_picture import ProfilePictureService
from app.services.auth import (
    authenticate_user,
    create_session,
    update_session_data,
    delete_session,
    extend_session_expiry,
    create_anonymous_session,
    create_user,
    hash_password,
)

router = APIRouter()

serializer = URLSafeTimedSerializer(settings.SECRET_KEY)


async def check_email_mx(email: str) -> bool:
    domain = email.split("@")[-1]
    resolver = aiodns.DNSResolver()
    try:
        result = await resolver.query(domain, "MX")
        return len(result) > 0
    except aiodns.error.DNSError:
        return False


# ------------------------------
# Registration
# ------------------------------
@router.post("/")
async def register(
    user_create: UserCreate,
    request: Request,
    anonymous_session_id: str | None = Cookie(None),
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    if not await check_email_mx(user_create.email):
        raise HTTPException(status_code=400, detail="Имейлa е невалиден.")

    existing_user = (
        (await db_read.execute(select(User).where(User.email == user_create.email)))
        .scalars()
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400, detail="Акаунт с този имейл вече съществува."
        )

    user = await create_user(user_create, db_write)
    session_id = await create_session(user)
    expires_at = datetime.utcnow() + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)

    # -------------------- Claim drafts before deleting anon session --------------------
    if anonymous_session_id:
        result_user_invites = await db_read.execute(
            select(func.count(Invitation.id)).where(
                Invitation.owner_id == user.id,
                Invitation.status == InvitationStatus.DRAFT
            )
        )
        user_invite_count = result_user_invites.scalar() or 0

        result_drafts = await db_read.execute(
            select(Invitation).where(Invitation.anon_session_id == anonymous_session_id)
        )
        drafts = result_drafts.scalars().all()

        max_allowed = 3 - user_invite_count
        drafts_to_transfer = drafts[:max_allowed] if max_allowed > 0 else []

        for draft in drafts_to_transfer:
            draft = await db_write.merge(draft)
            draft.owner_id = user.id
            draft.anon_session_id = None

        if drafts_to_transfer:
            await db_write.commit()

        await delete_session(anonymous_session_id, anonymous=True)

    # -------------------- Track unique user --------------------
    unique_id = request.cookies.get("unique_id") or str(user.id)
    await increment_daily_user_stat(unique_id, db_write)

    # -------------------- Send Welcome Email --------------------
    html_content = render_email(
        "customers/welcome.html",
        {
            "first_name": user.first_name or user.email,
            "email": user.email,
            "provider": getattr(user_create, "provider", None),
            "logo_url": f"{settings.FRONTEND_BASE_URL}/logo.png",
        },
    )

    send_email(
        to=user.email,
        subject="Добре дошли в МоятаПокана",
        body=f"Добре дошли, {user.first_name or user.email}!",
        html=html_content,
    )

    return {
        "session_id": session_id,
        "unique_id": unique_id,
        "message": "Registration successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


# ------------------------------
# Login
# ------------------------------
@router.post("/login")
async def login(
    form_data: UserLogin,
    request: Request,
    anonymous_session_id: str | None = Cookie(None),
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    user = await authenticate_user(form_data.email, form_data.password, db_read)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидно име или парола",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нямате разрешение да влезете в системата.",
        )

    # Delete any anonymous session on login
    if anonymous_session_id:
        await delete_session(anonymous_session_id, anonymous=True)

    # Create user session
    session_id = await create_session(user)
    expires_at = datetime.utcnow() + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)

    # Use the existing unique_id cookie (or fallback to user id if missing)
    unique_id = request.cookies.get("unique_id") or str(user.id)
    await increment_daily_user_stat(unique_id, db_write)

    return {
        "session_id": session_id,
        "unique_id": unique_id,
        "message": "Login successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


# ------------------------------
# Get current user
# ------------------------------
@router.get("/me", response_model=UserRead)
async def get_me(
    session_data: dict = Depends(require_role("customer")),
    db_read: AsyncSession = Depends(get_read_session),
):
    email = session_data.get("email")
    result = await db_read.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="Нямате разрешение")
    return user


# ------------------------------
# Update profile
# ------------------------------
@router.patch("/me", response_model=UserUpdate)
async def update_profile(
    request: Request,
    profile_picture: UploadFile | None = File(None),
    session_data: dict = Depends(require_role("customer")),
    db_write: AsyncSession = Depends(get_write_session),
):
    email = session_data.get("email")

    if request.headers.get("content-type", "").startswith("application/json"):
        body = await request.json()
        first_name = body.get("first_name")
        last_name = body.get("last_name")
    else:
        form = await request.form()
        first_name = form.get("first_name")
        last_name = form.get("last_name")
        if not profile_picture and "profile_picture" in form:
            profile_picture = form["profile_picture"]

    result = await db_write.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name

    if profile_picture:
        profile_service = ProfilePictureService()
        if user.profile_picture:
            try:
                await profile_service._delete(user.profile_picture)
            except Exception as e:
                print(f"Failed to delete old profile picture: {e}")
        url = await profile_service.upload_profile_picture(profile_picture)
        user.profile_picture = url

    db_write.add(user)
    await db_write.commit()
    await db_write.refresh(user)
    await update_session_data(session_data["session_id"], user)

    return UserUpdate(
        first_name=user.first_name,
        last_name=user.last_name,
        profile_picture=user.profile_picture,
    )


# ------------------------------
# Logout
# ------------------------------
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session_id: str | None = Cookie(None),
    _=Depends(require_role("customer")),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="Няма намерена сесия")

    await delete_session(session_id)
    return


# ------------------------------
# Refresh session
# ------------------------------
@router.post("/refresh-session")
async def refresh_session(
    session_id: str | None = Cookie(None),
    _=Depends(require_role("customer")),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="Няма намерена сесия")

    updated = await extend_session_expiry(session_id)
    if not updated:
        raise HTTPException(
            status_code=401, detail="Грешка при обновяването на сесията"
        )

    return {"message": "Сесията е обновена", "session_id": session_id}


# ------------------------------
# Password reset
# ------------------------------
@router.post("/password-reset/request")
async def password_reset_request(
    request: PasswordResetRequest,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    result = await db_read.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=403, detail="Нямате разрешение да извършите това действие."
        )

    token = serializer.dumps(user.email, salt="password-reset-salt")
    reset_token = PasswordResetToken(user_id=user.id, token=token)
    db_write.add(reset_token)
    await db_write.commit()

    reset_link = f"{settings.FRONTEND_BASE_URL}/password-reset/{token}/"

    html_content = render_email(
        "customers/password_reset.html",
        {
            "first_name": user.first_name,
            "reset_url": reset_link,
            "logo_url": f"{settings.FRONTEND_BASE_URL}/logo.png",
        },
    )

    subject = "Ресет на парола"
    plain_body = (
        f"Здравейте {user.first_name or user.email},\n\n"
        f"Натиснете линка за да смените паролата:\n{reset_link}"
    )

    send_email(to=user.email, subject=subject, body=plain_body, html=html_content)
    return {"message": "Линк за смяна на паролата беше изпратен на имейла ви."}


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    data: PasswordResetConfirm,
    db_write: AsyncSession = Depends(get_write_session),
):
    try:
        email = serializer.loads(
            data.token,
            salt="password-reset-salt",
            max_age=settings.RESET_TOKEN_EXPIRE_SECONDS,
        )
    except (SignatureExpired, BadSignature):
        raise HTTPException(status_code=400, detail="Невалиден токен")

    result = await db_write.execute(
        select(PasswordResetToken).where(
            (PasswordResetToken.token == data.token) & (~PasswordResetToken.used)
        )
    )
    reset_token = result.scalars().first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Невалиден токен")

    result = await db_write.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нямате разрешение да извършите това действие.",
        )

    user.hashed_password = hash_password(data.new_password)
    reset_token.used = True
    await db_write.commit()

    return {"message": "Паролата беше сменена успешно."}


# ------------------------------
# Anonymous session
# ------------------------------
@router.post("/anonymous-session")
async def create_anon_session(
    request: Request,
    session: AsyncSession = Depends(get_write_session),
):
    session_id = await create_anonymous_session()
    expires_at = datetime.utcnow() + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)
    unique_id = request.cookies.get("unique_id") or str(uuid.uuid4())

    # record unique user for today
    await increment_daily_user_stat(unique_id, session)

    return {
        "anonymous_session_id": session_id,
        "unique_id": unique_id,
        "message": "Anonymous session created",
        "expires_at": expires_at.isoformat() + "Z",
    }
