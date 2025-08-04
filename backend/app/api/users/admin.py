from fastapi import APIRouter, Depends
from app.core.permissions import require_role

router = APIRouter()


@router.get("/admin")
async def admin_endpoint(user=Depends(require_role("admin"))):
    return {"message": f"Hello admin {user.username}"}
