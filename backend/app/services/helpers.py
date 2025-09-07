from urllib.parse import urlencode
from datetime import datetime
import uuid
import re
from unidecode import unidecode

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

def generate_slug(title: str) -> str:
    title_ascii = unidecode(title)
    slug_base = re.sub(r"[^a-zA-Z0-9]+", "-", title_ascii.lower()).strip("-")
    slug = f"{slug_base}-{uuid.uuid4().hex[:16]}"
    return slug
