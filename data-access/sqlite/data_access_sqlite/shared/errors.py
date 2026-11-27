from typing import Literal, Never

from atempo_errors import DomainError, ErrorReason, create_error_factory

ERROR_REASONS: dict[str, ErrorReason] = {
    "string": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un string",
    },
    "nullable_string": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un string o null",
    },
    "empty": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un string no vacío",
    },
    "uuid": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un uuid",
    },
    "date": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser una fecha",
    },
    "instant": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser una fecha con zona horaria",
    },
    "object": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un objeto",
    },
    "format": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} tiene un formato inválido",
    },
    "order": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser posterior a session.start_at",
    },
    "integer": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un entero",
    },
    "int_range": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} no cabe en un entero de 64 bits",
    },
    "non_negative": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe ser un entero no negativo",
    },
    "required": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} es obligatorio",
    },
    "forbidden": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} no aplica",
    },
    "window": {
        "kind": "VALIDATION",
        "message": lambda label: f"{label} debe estar dentro de la sesión",
    },
    "taken": {
        "kind": "CONFLICT",
        "message": lambda label: f"{label} ya existe",
    },
    "has_children": {
        "kind": "CONFLICT",
        "message": lambda label: f"{label} todavía tiene asistencias",
    },
    "missing": {
        "kind": "NOT_FOUND",
        "message": lambda label: f"{label} no existe",
    },
    "not_created": {
        "kind": "PERSISTENCE",
        "message": lambda label: f"{label} no se ha creado",
    },
    "unmapped": {
        "kind": "PERSISTENCE",
        "message": lambda _label: "error de SQLite",
    },
    "missing_env": {
        "kind": "CONFIGURATION",
        "message": lambda label: (
            f"Falta {label[label.find('.') + 1 :]}" if "." in label else f"Falta {label}"
        ),
    },
    "invalid_url": {
        "kind": "CONFIGURATION",
        "message": lambda label: f"{label} no es una URL válida",
    },
    "not_sqlite": {
        "kind": "CONFIGURATION",
        "message": lambda label: f"{label} tiene que ser una URL de SQLite",
    },
}

ErrorReasonName = Literal[
    "string",
    "nullable_string",
    "empty",
    "uuid",
    "date",
    "instant",
    "object",
    "format",
    "order",
    "integer",
    "int_range",
    "non_negative",
    "required",
    "forbidden",
    "window",
    "taken",
    "has_children",
    "missing",
    "not_created",
    "unmapped",
    "missing_env",
    "invalid_url",
    "not_sqlite",
]

# Dónde falla algo: la entidad (`session`) o la entidad y su campo
# (`session.end_at`). El id de un error es `label.reason`, por ejemplo
# `session.end_at.order`.
ErrorLabel = Literal[
    "session",
    "session.id",
    "session.course_id",
    "session.professor_id",
    "session.start_at",
    "session.end_at",
    "session.status",
    "session.closed_at",
    "session.late_after_minutes",
    "session.expected_count",
    "attendance",
    "attendance.session_id",
    "attendance.student_id",
    "attendance.status",
    "attendance.check_in_method",
    "attendance.checked_in_at",
    "sqlite",
    "sqlite.SQLITE_DATABASE_URL",
    "fecha",
]

ErrorId = str

ERROR_MESSAGES: dict[str, str] = {
    "session.status.format": "session.status debe ser open, closing o closed",
    "session.closed_at.required": (
        "session.closed_at es obligatorio si el estado es closed"
    ),
    "session.closed_at.forbidden": (
        "session.closed_at solo puede ir con el estado closed"
    ),
    "attendance.status.format": (
        "attendance.status debe ser present, present_late, absent o notified_absence"
    ),
    "attendance.check_in_method.format": (
        "attendance.check_in_method debe ser button, qr o null"
    ),
    "attendance.check_in_method.required": (
        "attendance.check_in_method es obligatorio si el estado es present o present_late"
    ),
    "attendance.checked_in_at.required": (
        "attendance.checked_in_at es obligatorio si el estado es present o present_late"
    ),
    "attendance.check_in_method.forbidden": (
        "attendance.check_in_method solo puede ir con present o present_late"
    ),
    "attendance.checked_in_at.forbidden": (
        "attendance.checked_in_at solo puede ir con present o present_late"
    ),
    "sqlite.taken": "registro duplicado",
    "sqlite.SQLITE_DATABASE_URL.invalid_url": (
        "SQLITE_DATABASE_URL no es una URL válida"
    ),
    "sqlite.SQLITE_DATABASE_URL.not_sqlite": (
        "SQLITE_DATABASE_URL tiene que ser una URL de SQLite"
    ),
}

_factory = create_error_factory(ERROR_REASONS, ERROR_MESSAGES)


def build_error(label: ErrorLabel, reason: ErrorReasonName) -> DomainError:
    return _factory.domain_error(label, reason)


def fail(
    label: ErrorLabel,
    reason: ErrorReasonName,
    *,
    cause: BaseException | None = None,
) -> Never:
    """Lanza el error de dominio de `label.reason`.

    Lleva su tipo escrito: el analizador solo acepta labels y reasons del
    catálogo, y solo estrecha el tipo después de una llamada que devuelve
    `Never` si la función tiene un tipo explícito.
    """
    _factory.fail(label, reason, cause=cause)
