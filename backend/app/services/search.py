from sqlalchemy import or_, and_, text, desc, asc, select, bindparam
from sqlalchemy.ext.asyncio import AsyncSession
from transliterate import translit
import re

LATIN_RE = re.compile(r"[A-Za-z]")
CYRILLIC_RE = re.compile(r"[А-Яа-я]")


async def apply_filters_search_ordering(
    model,
    db: AsyncSession,
    search: str | None = None,
    search_columns: list = None,
    filters: list | None = None,
    ordering: str = "-created_at",
    trigram_threshold: float = 0.7,
):
    filters = filters or []
    search_columns = search_columns or []

    await db.execute(text(f"SET pg_trgm.similarity_threshold = {trigram_threshold}"))

    async def build_filters(query: str):
        if not query:
            return None
        words = query.strip().split()
        if not words:
            return None
        search_filters = []

        for idx, word in enumerate(words):
            word_column_filters = []
            for col in search_columns:
                if len(word) < 4:
                    word_column_filters.append(col.ilike(f"%{word}%"))
                else:
                    word_column_filters.append(
                        text(f"{col.key} % :word{idx}").bindparams(
                            bindparam(f"word{idx}", word)
                        )
                    )
                    word_column_filters.append(col.ilike(f"%{word}%"))
            search_filters.append(or_(*word_column_filters))
        return and_(*search_filters)

    filt = await build_filters(search)
    temp_filters = filters.copy()
    if filt is not None:
        temp_filters.append(filt)
        stmt = select(model).where(*temp_filters).limit(1)
        result = await db.execute(stmt)
        if result.scalars().first():
            filters.append(filt)
        else:
            search_translit = None
            try:
                if search and LATIN_RE.search(search):
                    search_translit = translit(search, "bg")
                elif search and CYRILLIC_RE.search(search):
                    search_translit = translit(search, reversed=True)
            except Exception:
                pass

            if search_translit and search_translit != search:
                filt_translit = await build_filters(search_translit)
                if filt_translit is not None:
                    filters.append(filt_translit)

    # Ordering
    if ordering.startswith("-"):
        order_column = getattr(model, ordering[1:], getattr(model, "created_at"))
        order_by = [desc(order_column)]
    else:
        order_column = getattr(model, ordering, getattr(model, "created_at"))
        order_by = [asc(order_column)]

    return filters, order_by
