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


def truncate_to_milliseconds(value: datetime) -> datetime:
    utc = value.astimezone(timezone.utc)
    return utc.replace(microsecond=(utc.microsecond // 1000) * 1000)


def normalize_instant(value: datetime) -> str:
    utc = truncate_to_milliseconds(value)
    milliseconds = utc.microsecond // 1000
    return utc.strftime("%Y-%m-%dT%H:%M:%S") + f".{milliseconds:03d}Z"


def assert_nullable_string(value: object, label: str) -> str | None:
    if value is not None and not isinstance(value, str):
        raise ValueError(f"{label} debe ser string o null")
    return value


def assert_int(value: object, label: str) -> int:
    if type(value) is not int:
        raise ValueError(f"{label} debe ser un entero")
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
