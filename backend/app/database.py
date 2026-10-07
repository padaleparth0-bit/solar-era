import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Always store the SQLite database inside the backend/ directory,
# regardless of what folder the script is run from.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB = f"sqlite:///{_BACKEND_DIR / 'solar_era.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB)

# Create SQLite engine
# 'check_same_thread=False' allows FastAPI multi-threaded request handling
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# SessionLocal is the database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for ORM Models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session per request
    and guarantees proper closing.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
