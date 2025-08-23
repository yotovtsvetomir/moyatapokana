from fastapi import APIRouter, HTTPException, Depends, Cookie, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import get_write_session, get_read_session
from app.db.models.invitation import Invitation, RSVP, Event, SlideshowImage
from app.schemas.invitation import InvitationUpdate, InvitationRead
from app.services.auth import get_session

router = APIRouter()


# -------------------- Helper to get current user session --------------------
async def get_current_user(session_id: str | None = Cookie(None)) -> dict | None:
    """Return current logged-in user session data or None"""
    if not session_id:
        return None
    session_data = await get_session(session_id)
    return session_data


# -------------------- Helper to fetch invitation with ownership --------------------
async def fetch_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
    anon_session_id: str | None = Cookie(None),
) -> Invitation:
    """Fetch invitation and verify ownership by user or anon session"""
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.events),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
        )
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Registered user ownership
    if invitation.owner_id:
        if not current_user or invitation.owner_id != int(current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Anonymous invitation ownership
        if invitation.anon_session_id != anon_session_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return invitation


# -------------------- Get Invitation --------------------
@router.get("/{invitation_id}", response_model=InvitationRead)
async def get_invitation(invitation: Invitation = Depends(fetch_invitation)):
    return invitation


# -------------------- Create Empty Invitation --------------------
@router.post("/create", response_model=InvitationRead)
async def create_empty_invitation(
    db: AsyncSession = Depends(get_write_session),
    current_user: dict | None = Depends(get_current_user),
    anon_session_id: str | None = Cookie(None),
):
    owner_id = int(current_user.get("user_id")) if current_user else None

    # -------------------- Check Draft Limits --------------------
    query = select(Invitation).where(
        (Invitation.owner_id == owner_id)
        if owner_id
        else (Invitation.anon_session_id == anon_session_id)
    )
    result = await db.execute(query)
    existing_drafts = result.scalars().all()

    limit = 3 if current_user else 1

    if len(existing_drafts) >= limit:
        user_type = (
            "регистриран потребител" if current_user else "нерегистриран потребител"
        )
        draft_word = "чернова" if limit == 1 else "чернови"
        existing_draft_id = existing_drafts[0].id
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Достигнахте лимита от {limit} {draft_word} за {user_type}",
                "existingDraftId": existing_draft_id,
            },
        )

    # -------------------- Create RSVP --------------------
    rsvp_obj = RSVP(ask_menu=False)
    db.add(rsvp_obj)
    await db.flush()

    # -------------------- Create Invitation --------------------
    invitation_obj = Invitation(
        title="",
        description="",
        extra_info="",
        rsvp_id=rsvp_obj.id,
        is_active=False,
        owner_id=owner_id,
        anon_session_id=None if current_user else anon_session_id,
    )

    db.add(invitation_obj)
    await db.commit()
    await db.refresh(invitation_obj)

    # -------------------- Eager-load relationships --------------------
    result = await db.execute(
        select(Invitation)
        .options(
            selectinload(Invitation.rsvp).selectinload(RSVP.guests),
            selectinload(Invitation.selected_game_obj),
            selectinload(Invitation.selected_slideshow_obj),
        )
        .where(Invitation.id == invitation_obj.id)
    )
    invitation_with_rel = result.scalars().first()
    return invitation_with_rel


# -------------------- Update Invitation --------------------
@router.patch("/update/{invitation_id}", response_model=InvitationRead)
async def update_invitation(
    payload: InvitationUpdate,
    invitation: Invitation = Depends(fetch_invitation),
    db: AsyncSession = Depends(get_write_session),
):
    # -------------------- Update Invitation Fields --------------------
    update_data = payload.dict(
        exclude_unset=True,
        exclude={
            "rsvp",
            "events",
            "slideshow_images",
            "owner_id",
            "anon_session_id",
            "is_active",
            "active_from",
            "active_until",
            "preview_token",
            "status",
        },
    )
    for key, value in update_data.items():
        setattr(invitation, key, value)

    # -------------------- Update RSVP --------------------
    if payload.rsvp:
        rsvp_obj = invitation.rsvp
        if not rsvp_obj:
            rsvp_obj = RSVP(ask_menu=payload.rsvp.ask_menu)
            db.add(rsvp_obj)
            await db.flush()
            invitation.rsvp_id = rsvp_obj.id

        rsvp_data = payload.rsvp.dict(exclude_unset=True, exclude={"guests"})
        for key, value in rsvp_data.items():
            setattr(rsvp_obj, key, value)

    # -------------------- Update Events --------------------
    if payload.events is not None:
        for e in invitation.events:
            await db.delete(e)
        for event in payload.events:
            db.add(Event(**event.dict(), invitation_id=invitation.id))

    # -------------------- Update Slideshow Images --------------------
    if hasattr(payload, "slideshow_images") and payload.slideshow_images is not None:
        for img in invitation.slideshow_images:
            await db.delete(img)
        for img_data in payload.slideshow_images:
            db.add(SlideshowImage(**img_data.dict(), invitation_id=invitation.id))

    await db.commit()
    await db.refresh(invitation)
    return invitation


# -------------------- List Invitations with Pagination --------------------
@router.get("/", response_model=dict)
async def list_invitations(
    db: AsyncSession = Depends(get_read_session),
    current_user: dict | None = Depends(get_current_user),
    anon_session_id: str | None = Cookie(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    offset = (page - 1) * page_size
    owner_id = int(current_user.get("user_id")) if current_user else None

    query = select(Invitation).options(
        selectinload(Invitation.rsvp).selectinload(RSVP.guests),
        selectinload(Invitation.events),
        selectinload(Invitation.category),
        selectinload(Invitation.subcategory),
        selectinload(Invitation.selected_game_obj),
        selectinload(Invitation.selected_slideshow_obj),
    )

    if owner_id:
        query = query.where(Invitation.owner_id == owner_id)
        total_result = await db.execute(
            select(Invitation).where(Invitation.owner_id == owner_id)
        )
    else:
        query = query.where(Invitation.anon_session_id == anon_session_id)
        total_result = await db.execute(
            select(Invitation).where(Invitation.anon_session_id == anon_session_id)
        )

    total_count = total_result.scalars().count()

    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    invitations = result.scalars().all()

    total_pages = (total_count + page_size - 1) // page_size

    return {
        "total_count": total_count,
        "current_page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": invitations,
    }


# -------------------- Delete Invitation --------------------
@router.delete("/delete/{invitation_id}", status_code=204)
async def delete_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_write_session),
):
    result = await db.execute(select(Invitation).where(Invitation.id == invitation_id))
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    await db.delete(invitation)
    await db.commit()
    return
