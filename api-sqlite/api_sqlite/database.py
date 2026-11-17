"""Small SQLAlchemy Core connection layer for SQLite health checks."""

from sqlalchemy import Engine, create_engine, text


def create_database_engine(database_url: str) -> Engine:
    """Create a lazy engine; the first real connection happens on connect()."""
    return create_engine(database_url, pool_pre_ping=True)


def check_database(engine: Engine) -> None:
    """Open SQLite and execute a minimal query to confirm it is usable."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
