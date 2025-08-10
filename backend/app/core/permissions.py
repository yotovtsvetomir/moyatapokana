from fastapi import Depends, HTTPException, status, Cookie
from app.services.auth import get_session


async def is_authenticated(session_id: str | None = Cookie(None)):
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Нямате разрешение"
        )

    session_data = await get_session(session_id)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Нямате разрешение"
        )

    username = session_data.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Нямате разрешение"
        )

    return session_data


def require_role(required_role: str):
    async def role_checker(current=Depends(is_authenticated)):
        if current.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нямате разрешение да извършите това действие.",
            )
        return current

    return role_checker
