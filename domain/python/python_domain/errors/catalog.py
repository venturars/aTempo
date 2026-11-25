from collections.abc import Callable
from typing import Literal, TypedDict

from python_domain.errors.domain_error import DomainErrorCode


class ReasonSpec(TypedDict):
    code: DomainErrorCode
    message: Callable[[str], str]


DOMAIN_ERROR_REASONS: dict[str, ReasonSpec] = {
    "empty": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser un string no vacío",
    },
    "uuid": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser un uuid",
    },
    "date": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser una fecha",
    },
    "instant": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser una fecha con zona horaria",
    },
    "object": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser un objeto",
    },
    "format": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} tiene un formato inválido",
    },
    "order": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser posterior a session.start_at",
    },
    "integer": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser un entero",
    },
    "int_range": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} no cabe en un entero de 64 bits",
    },
    "non_negative": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe ser un entero no negativo",
    },
    "required": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} es obligatorio",
    },
    "forbidden": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} no aplica",
    },
    "window": {
        "code": "VALIDATION",
        "message": lambda label: f"{label} debe estar dentro de la sesión",
    },
    "taken": {
        "code": "CONFLICT",
        "message": lambda label: f"{label} ya existe",
    },
    "has_children": {
        "code": "CONFLICT",
        "message": lambda label: f"{label} todavía tiene asistencias",
    },
    "missing": {
        "code": "NOT_FOUND",
        "message": lambda label: f"{label} no existe",
    },
    "not_created": {
        "code": "PERSISTENCE",
        "message": lambda label: f"{label} no se ha creado",
    },
    "unmapped": {
        "code": "PERSISTENCE",
        "message": lambda _label: "error de SQLite",
    },
    "missing_env": {
        "code": "CONFIGURATION",
        "message": lambda label: (
            f"Falta {label[label.find('.') + 1 :]}" if "." in label else f"Falta {label}"
        ),
    },
    "invalid_url": {
        "code": "CONFIGURATION",
        "message": lambda label: f"{label} no es una URL válida",
    },
    "not_sqlite": {
        "code": "CONFIGURATION",
        "message": lambda label: f"{label} tiene que ser una URL de SQLite",
    },
}

DomainErrorReason = Literal[
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

DOMAIN_LABELS = (
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
)

DomainLabel = Literal[
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

DomainErrorId = str

DOMAIN_ERROR_MESSAGES: dict[str, str] = {
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
