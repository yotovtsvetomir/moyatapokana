import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import asynccontextmanager

DATABASE_URL_WRITER = os.getenv("DATABASE_URL_WRITER")
DATABASE_URL_READER = os.getenv("DATABASE_URL_READER")

engine_writer = create_async_engine(DATABASE_URL_WRITER, echo=False)
engine_reader = create_async_engine(DATABASE_URL_READER, echo=False)

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


@asynccontextmanager
async def write_session_cm():
    async for session in get_write_session():
        yield session


@asynccontextmanager
async def read_session_cm():
    async for session in get_read_session():
        yield session
