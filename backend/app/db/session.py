from app.core.settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

engine_writer = create_async_engine(settings.DATABASE_URL_WRITER, echo=False)
engine_reader = create_async_engine(settings.DATABASE_URL_READER, echo=False)

AsyncSessionLocalWriter = sessionmaker(
    bind=engine_writer,
    class_=AsyncSession,
    expire_on_commit=False,
)

AsyncSessionLocalReader = sessionmaker(
    bind=engine_reader,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_write_session():
    async with AsyncSessionLocalWriter() as session:
        yield session


async def get_read_session():
    async with AsyncSessionLocalReader() as session:
        yield session
