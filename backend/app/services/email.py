import os
import smtplib
from app.core.settings import settings
from email.message import EmailMessage
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = os.path.join("app", "templates")

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_email(template_name: str, context: dict) -> str:
    template = env.get_template(template_name)
    context.setdefault("year", datetime.now().year)
    return template.render(**context)


def send_email(to: str, subject: str, body: str, html: str | None = None):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to

    msg.set_content(body)

    if html:
        msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT) as server:
        if settings.MAIL_USER and settings.MAIL_PASS:
            server.starttls()
            server.login(settings.MAIL_USER, settings.MAIL_PASS)
        server.send_message(msg)
