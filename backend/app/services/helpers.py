from urllib.parse import urlencode
from datetime import datetime
import secrets
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.invitation import Invitation
from unidecode import unidecode
import re


SLUG_LENGTH = 64

async def generate_slug(db: AsyncSession, length: int = SLUG_LENGTH) -> str:
    alphabet = string.ascii_letters + string.digits
    while True:
        slug = ''.join(secrets.choice(alphabet) for _ in range(length))
        result = await db.execute(select(Invitation).where(Invitation.slug == slug))
        if not result.scalars().first():
            return slug

def slugify(text: str) -> str:
    text = unidecode(text)
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def generate_google_calendar_link(
    title: str,
    start: datetime,
    end: datetime,
    description: str = "",
    location: str = "",
) -> str:
    start_str = start.strftime("%Y%m%dT%H%M%SZ")
    end_str = end.strftime("%Y%m%dT%H%M%SZ")

    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": f"{start_str}/{end_str}",
        "details": description,
        "location": location,
        "sf": "true",
        "output": "xml",
    }

    return f"https://www.google.com/calendar/render?{urlencode(params)}"
