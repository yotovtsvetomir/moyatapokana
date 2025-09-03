import redis
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

from app.celery_app import celery_app
from app.db.celery_session import get_write_session
from app.db.models.invitation import Invitation, RSVP, Guest
from app.services.s3.wallpaper import WallpaperService
from app.services.s3.slide import SlideService
from app.services.s3.music import MusicService
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

# -------------------- Redis Lock --------------------
redis_client = redis.Redis(host="redis", port=6379, db=0)


# -------------------- Async Session Context --------------------
@asynccontextmanager
async def get_session() -> AsyncSession:
    """Provide a write async session from Celery tasks."""
    gen = get_write_session()
    session = await gen.__anext__()
    try:
        yield session
    finally:
        await gen.aclose()


# -------------------- Async Task Logic --------------------
async def delete_expired_invitations_async():
    """Delete all invitations whose active_until has passed."""
    now = datetime.utcnow()
    async with get_session() as session:
        # Fetch expired invitations with all relationships
        result = await session.execute(
            select(Invitation)
            .options(
                selectinload(Invitation.rsvp)
                .selectinload(RSVP.guests)
                .selectinload(Guest.sub_guests),
                selectinload(Invitation.events),
                selectinload(Invitation.slideshow_images),
            )
            .where(Invitation.active_until <= now)
        )
        expired_invitations = result.scalars().all()

        wallpaper_service = WallpaperService()
        slide_service = SlideService()
        music_service = MusicService()

        for invitation in expired_invitations:
            # Delete wallpaper
            if invitation.wallpaper:
                try:
                    await wallpaper_service._delete(invitation.wallpaper)
                except Exception as e:
                    print(f"Failed to delete wallpaper: {e}")

            # Delete background audio
            if invitation.background_audio:
                try:
                    await music_service.delete_music(invitation.background_audio)
                except Exception as e:
                    print(f"Failed to delete audio: {e}")

            # Delete slideshow images
            for slide in invitation.slideshow_images:
                try:
                    await slide_service._delete(slide.file_url)
                except Exception as e:
                    print(f"Failed to delete slide {slide.id}: {e}")
                await session.delete(slide)

            # Delete events
            for event in invitation.events:
                await session.delete(event)

            # Delete RSVP & Guests
            if invitation.rsvp:
                for guest in invitation.rsvp.guests:
                    for sub in guest.sub_guests:
                        sub.main_guest_id = None
                        session.add(sub)
                    await session.delete(guest)
                await session.delete(invitation.rsvp)

            # Delete invitation itself
            await session.delete(invitation)

        await session.commit()
        print(
            f"Deleted {len(expired_invitations)} expired invitations at {now.isoformat()}"
        )


# -------------------- Celery Task Entry --------------------
@celery_app.task(name="invitations.tasks.delete_expired_invitations")
def delete_expired_invitations():
    """Celery task wrapper with Redis lock to prevent concurrent execution."""
    lock_key = "lock:delete_expired_invitations"
    have_lock = redis_client.set(lock_key, "locked", nx=True, ex=60 * 60)
    if not have_lock:
        print("Lock exists, skipping the task.")
        return

    try:
        loop = celery_app.asyncio_loop
        loop.run_until_complete(delete_expired_invitations_async())
    finally:
        redis_client.delete(lock_key)
