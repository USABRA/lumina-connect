from collections.abc import Generator
from enum import Enum as PyEnum

from sqlalchemy import Enum, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


def string_enum(enum_cls: type[PyEnum]) -> Enum:
    """Store Python enum values (e.g. 'admin') not member names (e.g. 'ADMIN')."""
    return Enum(
        enum_cls,
        values_callable=lambda members: [member.value for member in members],
        native_enum=False,
    )

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
