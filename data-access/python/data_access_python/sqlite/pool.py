import contextvars
import os
import threading
from collections.abc import Callable
from contextlib import AbstractContextManager, nullcontext
from typing import Protocol, TypeVar

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import URL, Engine, Result, make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.pool import StaticPool

from data_access_python.shared.errors import fail
from data_access_python.sqlite.map_error import rethrow_sqlite

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

class _Database:
    """El engine abierto y el lock con el que se usa su conexión.

    En memoria todos los hilos comparten una sola conexión: el lock (un RLock)
    hace que la usen de uno en uno. Con un fichero cada hilo usa la suya y el
    lock no hace nada (nullcontext).
    """

    def __init__(self, engine: Engine, lock: AbstractContextManager[object]) -> None:
        self.engine = engine
        self.lock = lock


_database: _Database | None = None
_database_lock = threading.Lock()
_begin_immediate = contextvars.ContextVar("begin_immediate", default=False)
# La conexión de la transacción abierta en este contexto, si la hay.
_transaction_run: contextvars.ContextVar["SqliteQuery | None"] = (
    contextvars.ContextVar("transaction_run", default=None)
)


def _configure_connection(dbapi_connection: object, _connection_record: object) -> None:
    connection = dbapi_connection
    connection.isolation_level = None  # type: ignore[attr-defined]
    cursor = connection.cursor()  # type: ignore[attr-defined]
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def _on_begin(connection: object) -> None:
    sql = "BEGIN IMMEDIATE" if _begin_immediate.get() else "BEGIN"
    connection.exec_driver_sql(sql)  # type: ignore[attr-defined]


def read_sqlite_url(url: str) -> URL:
    """Una URL que no se puede leer o que no es de SQLite es un fallo de config."""
    try:
        parsed = make_url(url)
    except ArgumentError as error:
        fail("sqlite.SQLITE_DATABASE_URL", "invalid_url", cause=error)
    if parsed.get_backend_name() != "sqlite":
        fail("sqlite.SQLITE_DATABASE_URL", "not_sqlite")
    return parsed


def is_memory_url(url: URL) -> bool:
    database = url.database or ""
    if database in ("", ":memory:"):
        return True
    # URI de SQLite, por ejemplo sqlite:///file:datos?mode=memory&uri=true
    return url.query.get("mode") == "memory" or database.startswith("file::memory:")


def get_engine() -> Engine:
    return _get_database().engine


def _get_database() -> _Database:
    database = _database
    if database is not None:
        return database
    # Dos hilos en el primer uso no deben abrir dos bases.
    with _database_lock:
        if _database is None:
            _open_database()
        assert _database is not None
        return _database


def _open_database() -> None:
    global _database
    url = os.environ.get("SQLITE_DATABASE_URL")
    if not url:
        fail("sqlite.SQLITE_DATABASE_URL", "missing_env")
    parsed = read_sqlite_url(url)

    lock: AbstractContextManager[object]
    if is_memory_url(parsed):
        engine = create_engine(
            parsed,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        lock = threading.RLock()
    else:
        engine = create_engine(parsed)
        lock = nullcontext()

    event.listen(engine, "connect", _configure_connection)
    event.listen(engine, "begin", _on_begin)
    _database = _Database(engine, lock)


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
        transaction_run = _transaction_run.get()
        if transaction_run is not None:
            # Dentro de with_transaction se usa su conexión: abrir otra
            # transacción fallaría ("cannot start a transaction within a
            # transaction").
            return transaction_run(sql, params)
        database = _get_database()
        with database.lock, database.engine.begin() as connection:
            result = connection.execute(text(sql), params or {})
            return _from_result(result)
    except Exception as error:
        rethrow_sqlite(error)


def with_transaction(fn: Callable[[SqliteQuery], T]) -> T:
    open_run = _transaction_run.get()
    if open_run is not None:
        # Ya hay una transacción abierta en este contexto: se suma a ella.
        return fn(open_run)

    immediate_token = _begin_immediate.set(True)
    try:
        database = _get_database()
        with database.lock, database.engine.begin() as connection:

            def run(sql: str, params: SqliteParams | None = None) -> QueryResult:
                result = connection.execute(text(sql), params or {})
                return _from_result(result)

            run_token = _transaction_run.set(run)
            try:
                return fn(run)
            finally:
                _transaction_run.reset(run_token)
    except Exception as error:
        rethrow_sqlite(error)
    finally:
        _begin_immediate.reset(immediate_token)


def close_pool() -> None:
    global _database
    with _database_lock:
        database = _database
        _database = None
    if database is not None:
        # En memoria, espera a que ningún hilo esté usando la conexión.
        with database.lock:
            database.engine.dispose()


def reset_pool() -> None:
    close_pool()
