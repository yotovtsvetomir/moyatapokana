from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "app",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

import app.api.users.tasks  # noqa 401

celery_app.conf.beat_schedule = {
    "cleanup-expired-tokens-every-10-minutes": {
        "task": "app.api.users.tasks.cleanup_expired_tokens",
        "schedule": crontab(minute="*/1"),
    },
}

celery_app.conf.timezone = "UTC"
