from typing import Never

from python_domain.errors.catalog import (
    DOMAIN_ERROR_MESSAGES,
    DOMAIN_ERROR_REASONS,
    DomainErrorId,
    DomainErrorReason,
    DomainLabel,
)
from python_domain.errors.domain_error import (
    ConflictError,
    ConfigurationError,
    DomainError,
    DomainErrorKind,
    NotFoundError,
    PersistenceError,
    ValidationError,
    label_parts,
)

ERROR_BY_KIND: dict[DomainErrorKind, type[DomainError]] = {
    "VALIDATION": ValidationError,
    "NOT_FOUND": NotFoundError,
    "CONFLICT": ConflictError,
    "CONFIGURATION": ConfigurationError,
    "PERSISTENCE": PersistenceError,
}


def domain_error(
    label: DomainLabel,
    reason: DomainErrorReason,
) -> DomainError:
    error_id: DomainErrorId = f"{label}.{reason}"
    spec = DOMAIN_ERROR_REASONS[reason]
    message = DOMAIN_ERROR_MESSAGES.get(error_id, spec["message"](label))
    error_class = ERROR_BY_KIND[spec["kind"]]
    parts = label_parts(label)
    return error_class(
        message,
        id=error_id,
        entity=parts.get("entity"),
        field=parts.get("field"),
    )


def fail(
    label: DomainLabel,
    reason: DomainErrorReason,
    *,
    cause: BaseException | None = None,
) -> Never:
    error = domain_error(label, reason)
    if cause is not None:
        raise error from cause
    raise error
