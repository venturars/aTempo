import re
from datetime import datetime, timezone

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
INSTANT_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$"
)


def assert_non_empty_string(value: object, label: str) -> str:
    if not isinstance(value, str) or value == "":
        raise ValueError(f"{label} debe ser un string no vacío")
    return value


def assert_uuid(value: object, label: str) -> str:
    text = assert_non_empty_string(value, label)
    if UUID_RE.match(text) is None:
        raise ValueError(f"{label} debe ser un uuid")
    return text.lower()


def truncate_to_milliseconds(value: datetime, label: str = "fecha") -> datetime:
    try:
        utc = value.astimezone(timezone.utc)
    except OverflowError as error:
        raise ValueError(f"{label} debe ser una fecha") from error
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
        raise ValueError(f"{label} debe ser un entero")
    if value < _SQLITE_INT_MIN or value > _SQLITE_INT_MAX:
        raise ValueError(f"{label} no cabe en un entero de 64 bits")
    return value


def assert_nullable_int(value: object, label: str) -> int | None:
    if value is None:
        return None
    return assert_int(value, label)


def assert_instant(value: object, label: str) -> datetime:
    text = assert_non_empty_string(value, label)
    if INSTANT_RE.match(text) is None:
        raise ValueError(f"{label} debe ser una fecha con zona horaria")
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{label} debe ser una fecha") from error


def assert_nullable_instant(value: object, label: str) -> datetime | None:
    if value is None:
        return None
    return assert_instant(value, label)
