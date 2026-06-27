import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Default to SQLite astrobuilds.db, but support environment override (e.g. PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./astrobuilds.db")

# For SQLite, we need to allow multi-threaded access
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """Apply lightweight schema updates for existing SQLite databases."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    tables = insp.get_table_names()

    if "material_requirements" in tables:
        cols = {c["name"] for c in insp.get_columns("material_requirements")}
        with engine.begin() as conn:
            if "status" not in cols:
                conn.execute(text(
                    "ALTER TABLE material_requirements ADD COLUMN status VARCHAR DEFAULT 'Pending approval'"
                ))
            if "requested_by" not in cols:
                conn.execute(text(
                    "ALTER TABLE material_requirements ADD COLUMN requested_by VARCHAR"
                ))
