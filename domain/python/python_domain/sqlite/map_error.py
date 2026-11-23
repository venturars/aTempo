from typing import Never

from sqlalchemy.exc import IntegrityError

from python_domain.errors import ConflictError, NotFoundError, PersistenceError


def _integrity_message(error: IntegrityError) -> str:
    orig = error.orig
    if orig is None:
        return str(error)
    return str(orig)


def domain_error_from_sqlite(error: BaseException) -> Exception | None:
    if not isinstance(error, IntegrityError):
        return None

    message = _integrity_message(error)
    if "UNIQUE constraint failed" in message:
        if "attendance" in message:
            return ConflictError("attendance ya existe", entity="attendance")
        if "session" in message:
            return ConflictError("session ya existe", entity="session")
        return ConflictError("registro duplicado", entity="sqlite")
    if "FOREIGN KEY constraint failed" in message:
        return NotFoundError("session no existe", entity="session")
    return None


def rethrow_sqlite(error: BaseException) -> Never:
    mapped = domain_error_from_sqlite(error)
    if mapped is not None:
        raise mapped from error
    if isinstance(error, Exception):
        raise error
    raise PersistenceError("error de SQLite", entity="sqlite") from error
