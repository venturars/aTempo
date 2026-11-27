from collections.abc import Callable, Mapping
from typing import NamedTuple, Never, TypedDict

from atempo_errors.errors import (
    ConflictError,
    ConfigurationError,
    DomainError,
    DomainErrorKind,
    NotFoundError,
    PersistenceError,
    ValidationError,
    label_parts,
)


class ErrorReason(TypedDict):
    kind: DomainErrorKind
    message: Callable[[str], str]


class ErrorFactory(NamedTuple):
    domain_error: Callable[[str, str], DomainError]
    fail: Callable[..., Never]


ERROR_BY_KIND: dict[DomainErrorKind, type[DomainError]] = {
    "VALIDATION": ValidationError,
    "NOT_FOUND": NotFoundError,
    "CONFLICT": ConflictError,
    "CONFIGURATION": ConfigurationError,
    "PERSISTENCE": PersistenceError,
}


def create_error_factory(
    reasons: Mapping[str, ErrorReason],
    messages: Mapping[str, str] | None = None,
) -> ErrorFactory:
    """Crea `domain_error` y `fail` a partir del catálogo de un paquete.

    `domain_error(label, reason)` devuelve el error con id `label.reason`.
    `fail(label, reason)` lo lanza. El mensaje sale de `messages[id]` si existe
    y, si no, de `reasons[reason]["message"](label)`.
    """
    overrides: Mapping[str, str] = messages or {}

    def domain_error(label: str, reason: str) -> DomainError:
        error_id = f"{label}.{reason}"
        spec = reasons[reason]
        message = overrides.get(error_id, spec["message"](label))
        error_class = ERROR_BY_KIND[spec["kind"]]
        parts = label_parts(label)
        return error_class(
            message,
            id=error_id,
            entity=parts.get("entity"),
            field=parts.get("field"),
        )

    def fail(
        label: str,
        reason: str,
        *,
        cause: BaseException | None = None,
    ) -> Never:
        error = domain_error(label, reason)
        if cause is not None:
            raise error from cause
        raise error

    return ErrorFactory(domain_error=domain_error, fail=fail)
