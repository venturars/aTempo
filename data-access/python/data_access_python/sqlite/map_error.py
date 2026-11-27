from typing import Never

from atempo_errors import DomainError
from sqlalchemy.exc import DBAPIError, IntegrityError

from data_access_python.shared.errors import build_error


def _integrity_message(error: IntegrityError) -> str:
    orig = error.orig
    if orig is None:
        return str(error)
    return str(orig)


def error_from_sqlite(error: BaseException) -> DomainError | None:
    if not isinstance(error, IntegrityError):
        return None

    message = _integrity_message(error)
    if "UNIQUE constraint failed" in message:
        if "attendance" in message:
            return build_error("attendance", "taken")
        if "session" in message:
            return build_error("session", "taken")
        return build_error("sqlite", "taken")
    if "FOREIGN KEY constraint failed" in message:
        # La única clave foránea es attendance.session_id. Al borrar una sesión
        # significa que aún tiene asistencias; al escribir una asistencia, que
        # la sesión no existe. SQLite da el mismo mensaje: decide la sentencia.
        if _is_delete(error):
            return build_error("session", "has_children")
        return build_error("session", "missing")
    return None


def _is_delete(error: IntegrityError) -> bool:
    statement = error.statement or ""
    return statement.lstrip().upper().startswith("DELETE")


def rethrow_sqlite(error: BaseException) -> Never:
    """Traduce un error de SQLite a un error de dominio.

    Un error de dominio (una regla que falló dentro de la transacción) sale tal
    cual. Un UNIQUE o FOREIGN KEY sale con su error propio. Cualquier otro error
    que lanza SQLite ("database is locked", "no such table", un CHECK) es
    PersistenceError. El resto (un parámetro que falta en la SQL, por ejemplo)
    son fallos de programación y salen sin tocar.
    """
    if isinstance(error, DomainError):
        raise error
    mapped = error_from_sqlite(error)
    if mapped is not None:
        raise mapped from error
    if isinstance(error, DBAPIError):
        raise build_error("sqlite", "unmapped") from error
    raise error
