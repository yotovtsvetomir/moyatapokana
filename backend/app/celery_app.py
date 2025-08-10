from celery import Celery
from celery.schedules import crontab
from celery.signals import worker_process_init
import asyncio

celery_app = Celery(
    "app",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)
celery_app.conf.broker_connection_retry_on_startup = True

import app.api.users.tasks  # noqa

celery_app.conf.beat_schedule = {
    "dummy-db-task-every-30-seconds": {
        "task": "app.tasks.dummy_db_task",
        "schedule": crontab(minute="*/10"),
    },
}

celery_app.conf.timezone = "UTC"


@worker_process_init.connect
def init_asyncio_loop(**kwargs):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    celery_app.asyncio_loop = loop
