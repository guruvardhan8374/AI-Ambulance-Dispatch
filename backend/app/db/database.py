import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Ensure directory exists for SQLite database path
if settings.DATABASE_URL.startswith("sqlite"):
    db_raw = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_raw.startswith("/"):
        db_dir = os.path.dirname(db_raw)
    else:
        db_dir = os.path.dirname(os.path.abspath(db_raw))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

# SQLite argument check
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
