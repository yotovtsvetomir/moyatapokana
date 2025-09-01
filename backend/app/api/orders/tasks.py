from app.celery_app import celery_app
from datetime import datetime
from contextlib import asynccontextmanager
from sqlalchemy.dialects.postgresql import insert
from app.db.celery_session import get_write_session
from app.db.models.order import CurrencyRate
from app.core.settings import settings
import requests


@asynccontextmanager
async def get_session():
    gen = get_write_session()
    session = await gen.__anext__()
    try:
        yield session
    finally:
        await gen.aclose()


async def fetch_and_update_rates_async():
    url = f"https://v6.exchangerate-api.com/v6/{settings.API_KEY}/latest/{settings.BASE_CURRENCY}"

    response = requests.get(url)
    if response.status_code != 200:
        return

    data = response.json()
    if data.get("result") != "success":
        return

    rates = data.get("conversion_rates", {})

    async with get_session() as session:
        for currency_code, rate in rates.items():
            stmt = (
                insert(CurrencyRate)
                .values(
                    currency=currency_code,
                    rate_to_bgn=rate,
                    updated_at=datetime.utcnow(),
                )
                .on_conflict_do_update(
                    index_elements=[CurrencyRate.currency],
                    set_={"rate_to_bgn": rate, "updated_at": datetime.utcnow()},
                )
            )
            await session.execute(stmt)

        await session.commit()


@celery_app.task(name="app.tasks.update_currency_rates")
def update_currency_rates():
    loop = celery_app.asyncio_loop
    loop.run_until_complete(fetch_and_update_rates_async())
