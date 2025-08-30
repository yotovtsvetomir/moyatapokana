from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Type


async def paginate(
    model,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    owner_field: str | None = None,
    owner_id: int | None = None,
    anon_field: str | None = None,
    anon_session_id: str | None = None,
    options: list = None,
    schema: Type[BaseModel] | None = None,
):
    offset = (page - 1) * page_size
    query = select(model)

    if options:
        for option in options:
            query = query.options(option)

    # Apply filters
    if owner_field and owner_id:
        query = query.where(getattr(model, owner_field) == owner_id)
        total_query = (
            select(func.count())
            .select_from(model)
            .where(getattr(model, owner_field) == owner_id)
        )
    elif anon_field and anon_session_id:
        query = query.where(getattr(model, anon_field) == anon_session_id)
        total_query = (
            select(func.count())
            .select_from(model)
            .where(getattr(model, anon_field) == anon_session_id)
        )
    else:
        total_query = select(func.count()).select_from(model)

    total_result = await db.execute(total_query)
    total_count = total_result.scalar_one()

    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    # Convert to Pydantic if schema is provided
    if schema:
        items = [schema.from_orm(item) for item in items]

    total_pages = (total_count + page_size - 1) // page_size

    return {
        "total_count": total_count,
        "current_page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "items": items,
    }
