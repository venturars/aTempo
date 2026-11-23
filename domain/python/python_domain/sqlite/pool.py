import contextvars
import os
from collections.abc import Callable
from typing import Protocol, TypeVar

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine, Result
from sqlalchemy.pool import StaticPool

from python_domain.errors import ConfigurationError
from python_domain.sqlite.map_error import rethrow_sqlite

SqliteScalar = str | int | None
SqliteParams = dict[str, SqliteScalar]
T = TypeVar("T")


class QueryResult:
    def __init__(self, rows: list[dict[str, SqliteScalar]], rowcount: int) -> None:
        self.rows = rows
        self.rowcount = rowcount


class SqliteQuery(Protocol):
    def __call__(
        self,
        sql: str,
        params: SqliteParams | None = None,
    ) -> QueryResult:
        ...

_engine: Engine | None = None
_begin_immediate = contextvars.ContextVar("begin_immediate", default=False)


def _configure_connection(dbapi_connection: object, _connection_record: object) -> None:
    connection = dbapi_connection
    connection.isolation_level = None  # type: ignore[attr-defined]
    cursor = connection.cursor()  # type: ignore[attr-defined]
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def _on_begin(connection: object) -> None:
    sql = "BEGIN IMMEDIATE" if _begin_immediate.get() else "BEGIN"
    connection.exec_driver_sql(sql)  # type: ignore[attr-defined]


def get_engine() -> Engine:
    global _engine
    if _engine is not None:
        return _engine

    url = os.environ.get("SQLITE_DATABASE_URL")
    if not url:
        raise ConfigurationError(
            "Falta SQLITE_DATABASE_URL",
            entity="sqlite",
            field="SQLITE_DATABASE_URL",
        )

    if url in {"sqlite://", "sqlite:///:memory:"}:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(url)

    event.listen(engine, "connect", _configure_connection)
    event.listen(engine, "begin", _on_begin)
    _engine = engine
    return engine


def _rowcount(result: Result[object], fallback: int) -> int:
    count = result.rowcount
    if count is None or count < 0:
        return fallback
    return count


def _from_result(result: Result[object]) -> QueryResult:
    if result.returns_rows:
        rows = [dict(row) for row in result.mappings().all()]
        return QueryResult(rows, _rowcount(result, len(rows)))
    return QueryResult([], _rowcount(result, 0))


def query(sql: str, params: SqliteParams | None = None) -> QueryResult:
    try:
        with get_engine().begin() as connection:
            result = connection.execute(text(sql), params or {})
            return _from_result(result)
    except Exception as error:
        rethrow_sqlite(error)


def with_transaction(fn: Callable[[SqliteQuery], T]) -> T:
    token = _begin_immediate.set(True)
    try:
        with get_engine().begin() as connection:

            def run(sql: str, params: SqliteParams | None = None) -> QueryResult:
                result = connection.execute(text(sql), params or {})
                return _from_result(result)

            return fn(run)
    except Exception as error:
        rethrow_sqlite(error)
    finally:
        _begin_immediate.reset(token)


def close_pool() -> None:
    global _engine
    if _engine is not None:
        _engine.dispose()
        _engine = None


def reset_pool() -> None:
    close_pool()
