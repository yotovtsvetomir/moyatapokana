import os
import smtplib
from email.message import EmailMessage

MAIL_HOST = os.getenv("MAIL_HOST", "localhost")
MAIL_PORT = int(os.getenv("MAIL_PORT", 1025))
MAIL_FROM = os.getenv("MAIL_FROM", "noreply@example.com")
MAIL_USER = os.getenv("MAIL_USER", None)
MAIL_PASS = os.getenv("MAIL_PASS", None)


def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to

    with smtplib.SMTP(MAIL_HOST, MAIL_PORT) as server:
        if MAIL_USER and MAIL_PASS:
            server.starttls()
            server.login(MAIL_USER, MAIL_PASS)
        server.send_message(msg)
