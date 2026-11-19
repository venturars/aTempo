import os
from collections.abc import Callable
from typing import Any

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine, Result
from sqlalchemy.pool import StaticPool

QueryFn = Callable[[str, dict[str, Any] | None], "QueryResult"]


class QueryResult:
    def __init__(self, rows: list[dict[str, Any]], rowcount: int) -> None:
        self.rows = rows
        self.rowcount = rowcount


_engine: Engine | None = None


def _enable_foreign_keys(dbapi_connection: Any, _connection_record: Any) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def get_engine() -> Engine:
    global _engine
    if _engine is not None:
        return _engine

    url = os.environ.get("SQLITE_DATABASE_URL")
    if not url:
        raise RuntimeError("Falta SQLITE_DATABASE_URL")

    if url in {"sqlite://", "sqlite:///:memory:"}:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(url)

    event.listen(engine, "connect", _enable_foreign_keys)
    _engine = engine
    return engine


def _rowcount(result: Result[Any], fallback: int) -> int:
    count = result.rowcount
    if count is None or count < 0:
        return fallback
    return count


def _from_result(result: Result[Any]) -> QueryResult:
    if result.returns_rows:
        rows = [dict(row) for row in result.mappings().all()]
        return QueryResult(rows, _rowcount(result, len(rows)))
    return QueryResult([], _rowcount(result, 0))


def query(sql: str, params: dict[str, Any] | None = None) -> QueryResult:
    with get_engine().begin() as connection:
        result = connection.execute(text(sql), params or {})
        return _from_result(result)


def with_transaction(fn: Callable[[QueryFn], Any]) -> Any:
    with get_engine().begin() as connection:

        def run(sql: str, params: dict[str, Any] | None = None) -> QueryResult:
            result = connection.execute(text(sql), params or {})
            return _from_result(result)

        return fn(run)


def close_engine() -> None:
    global _engine
    if _engine is not None:
        _engine.dispose()
        _engine = None


def reset_db() -> None:
    close_engine()
