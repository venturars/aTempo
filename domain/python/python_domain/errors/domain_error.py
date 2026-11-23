from typing import Literal

DomainErrorCode = Literal[
    "VALIDATION",
    "NOT_FOUND",
    "CONFLICT",
    "CONFIGURATION",
    "PERSISTENCE",
]


class DomainError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: DomainErrorCode,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.entity = entity
        self.field = field


class ValidationError(DomainError):
    def __init__(
        self,
        message: str,
        *,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(message, code="VALIDATION", entity=entity, field=field)


class NotFoundError(DomainError):
    def __init__(
        self,
        message: str,
        *,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(message, code="NOT_FOUND", entity=entity, field=field)


class ConflictError(DomainError):
    def __init__(
        self,
        message: str,
        *,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(message, code="CONFLICT", entity=entity, field=field)


class ConfigurationError(DomainError):
    def __init__(
        self,
        message: str,
        *,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(
            message,
            code="CONFIGURATION",
            entity=entity,
            field=field,
        )


class PersistenceError(DomainError):
    def __init__(
        self,
        message: str,
        *,
        entity: str | None = None,
        field: str | None = None,
    ) -> None:
        super().__init__(
            message,
            code="PERSISTENCE",
            entity=entity,
            field=field,
        )


def label_parts(label: str) -> dict[str, str]:
    separator = label.find(".")
    if separator == -1:
        return {"entity": label}
    return {
        "entity": label[:separator],
        "field": label[separator + 1 :],
    }
