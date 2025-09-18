from urllib.parse import urlencode
from datetime import datetime
import secrets
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.invitation import Invitation
import re
import random


SLUG_LENGTH = 64


CYRILLIC_ALPHABET = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЬЮЯабвгдежзиклмнопрстуфхцчшщьюя"


async def generate_slug(db: AsyncSession, length: int = SLUG_LENGTH) -> str:
    alphabet = CYRILLIC_ALPHABET + "0123456789"
    while True:
        slug = "".join(secrets.choice(alphabet) for _ in range(length))
        result = await db.execute(select(Invitation).where(Invitation.slug == slug))
        if not result.scalars().first():
            return slug


def generate_template_slug(title: str, suffix_length: int = 6) -> str:
    text = title.lower()
    text = re.sub(r"[^\w\d]+", "-", text, flags=re.UNICODE)
    text = text.strip("-")

    random_suffix = "".join(
        random.choices(CYRILLIC_ALPHABET + "0123456789", k=suffix_length)
    )

    slug = f"{text}-{random_suffix}"
    return slug


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\d]+", "-", text, flags=re.UNICODE)
    text = text.strip("-")
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
