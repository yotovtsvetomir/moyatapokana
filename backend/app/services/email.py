import os
import smtplib
from email.message import EmailMessage
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape

MAIL_HOST = os.getenv("MAIL_HOST", "localhost")
MAIL_PORT = int(os.getenv("MAIL_PORT", 1025))
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@example.com")
MAIL_USER = os.getenv("MAIL_USER", None)
MAIL_PASS = os.getenv("MAIL_PASS", None)

TEMPLATE_DIR = os.path.join("app", "templates", "customers", "emails")

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
    msg["From"] = MAIL_FROM
    msg["To"] = to

    msg.set_content(body)

    if html:
        msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(MAIL_HOST, MAIL_PORT) as server:
        if MAIL_USER and MAIL_PASS:
            server.starttls()
            server.login(MAIL_USER, MAIL_PASS)
        server.send_message(msg)
