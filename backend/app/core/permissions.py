from fastapi import Depends, HTTPException, status
from app.services.auth import get_current_user


def require_role(required_role: str):
    async def role_checker(current=Depends(get_current_user)):
        if current.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нямате разрешение да извършите това действие.",
            )
        return current

    return role_checker
