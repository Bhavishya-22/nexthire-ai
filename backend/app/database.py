import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

logger = logging.getLogger(__name__)

RAW_DATABASE_URL = os.getenv("DATABASE_URL")
if RAW_DATABASE_URL and RAW_DATABASE_URL.startswith("postgres://"):
    RAW_DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLITE_URL = "sqlite:///./nexthire.db"


def _create_resilient_engine():
    """
    Attempts to connect to PostgreSQL if configured.
    If PostgreSQL is unreachable or fails, gracefully falls back to local SQLite.
    """
    if RAW_DATABASE_URL and RAW_DATABASE_URL.startswith("postgresql"):
        try:
            temp_engine = create_engine(
                RAW_DATABASE_URL,
                connect_args={"connect_timeout": 4},
                pool_pre_ping=True
            )
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to PostgreSQL database.")
            return temp_engine, RAW_DATABASE_URL
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection failed ({e}). Gracefully falling back to local SQLite."
            )

    sqlite_engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
    return sqlite_engine, SQLITE_URL


engine, ACTIVE_DATABASE_URL = _create_resilient_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def is_postgres() -> bool:
    """
    Checks if the active database is PostgreSQL.
    """
    return bool(ACTIVE_DATABASE_URL and ACTIVE_DATABASE_URL.startswith("postgresql"))


def get_db():
    """
    FastAPI dependency that provides a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initializes database tables, pgvector extension if PostgreSQL,
    and runs lightweight column migrations.
    """
    try:
        if is_postgres():
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()

        Base.metadata.create_all(bind=engine)

        # Ensure newly added columns exist in users table
        with engine.connect() as conn:
            if is_postgres():
                conn.execute(text("""
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS target_role VARCHAR(255);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_filename VARCHAR(255);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data JSONB;
                """))
                conn.commit()
            else:
                # SQLite PRAGMA check
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_cols = [r[1] for r in res]
                migrations = [
                    ("onboarding_completed", "BOOLEAN DEFAULT 0"),
                    ("target_role", "VARCHAR(255)"),
                    ("resume_filename", "VARCHAR(255)"),
                    ("profile_data", "TEXT")
                ]
                for col_name, col_type in migrations:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")