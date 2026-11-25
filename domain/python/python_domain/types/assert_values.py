import re
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from python_domain.errors import ValidationError, label_parts

# Terminan en \Z y no en $: en Python, `$` también encaja antes de un salto de
# línea final, y un uuid seguido de un salto de línea pasaría como válido.
UUID_RE = re.compile(
    r"\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\Z",
    re.IGNORECASE,
)
INSTANT_RE = re.compile(
    r"\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})\Z"
)


def assert_non_empty_string(value: object, label: str) -> str:
    if not isinstance(value, str) or value == "":
        raise ValidationError(
            f"{label} debe ser un string no vacío",
            **label_parts(label),
        )
    return value


def read_input_field(input: object, key: str, label: str) -> Any:
    """Lee un campo del objeto de entrada (RORO). Si falta, ValidationError."""
    if not isinstance(input, Mapping) or key not in input:
        raise ValidationError(f"{label} es obligatorio", **label_parts(label))
    return input[key]


def assert_uuid(value: object, label: str) -> str:
    text = assert_non_empty_string(value, label)
    if UUID_RE.fullmatch(text) is None:
        raise ValidationError(f"{label} debe ser un uuid", **label_parts(label))
    return text.lower()


def read_input_uuid(input: object, key: str, label: str) -> str:
    """Lee un uuid del objeto de entrada (RORO) y lo devuelve en minúsculas."""
    return assert_uuid(read_input_field(input, key, label), label)


def truncate_to_milliseconds(value: datetime, label: str = "fecha") -> datetime:
    try:
        utc = value.astimezone(timezone.utc)
    except OverflowError as error:
        raise ValidationError(
            f"{label} debe ser una fecha",
            **label_parts(label),
        ) from error
    return utc.replace(microsecond=(utc.microsecond // 1000) * 1000)


def normalize_instant(value: datetime, label: str = "fecha") -> str:
    utc = truncate_to_milliseconds(value, label)
    milliseconds = utc.microsecond // 1000
    return (
        f"{utc.year:04d}-{utc.month:02d}-{utc.day:02d}"
        f"T{utc.hour:02d}:{utc.minute:02d}:{utc.second:02d}"
        f".{milliseconds:03d}Z"
    )


_SQLITE_INT_MIN = -2**63
_SQLITE_INT_MAX = 2**63 - 1


def assert_int(value: object, label: str) -> int:
    if type(value) is not int:
        raise ValidationError(f"{label} debe ser un entero", **label_parts(label))
    if value < _SQLITE_INT_MIN or value > _SQLITE_INT_MAX:
        raise ValidationError(
            f"{label} no cabe en un entero de 64 bits",
            **label_parts(label),
        )
    return value


def assert_nullable_int(value: object, label: str) -> int | None:
    if value is None:
        return None
    return assert_int(value, label)


def assert_instant(value: object, label: str) -> datetime:
    text = assert_non_empty_string(value, label)
    if INSTANT_RE.fullmatch(text) is None:
        raise ValidationError(
            f"{label} debe ser una fecha con zona horaria",
            **label_parts(label),
        )
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValidationError(
            f"{label} debe ser una fecha",
            **label_parts(label),
        ) from error


def assert_nullable_instant(value: object, label: str) -> datetime | None:
    if value is None:
        return None
    return assert_instant(value, label)
