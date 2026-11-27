"""Tipos de campo de los modelos.

Cada tipo pasa el valor por un `assert_*` de `shared/validation/assert_values.py`
antes de que Pydantic lo compruebe. Así un campo inválido lanza el error del
catálogo (`session.course_id debe ser un uuid`) y no un error de Pydantic. La
label es `<entidad>.<campo>`: la entidad sale del `title` del modelo.
"""

from typing import Annotated

from pydantic import BeforeValidator, ValidationInfo

from data_access_python.shared.errors import DomainLabel, fail
from data_access_python.shared.validation.assert_values import (
    assert_instant,
    assert_int,
    assert_non_empty_string,
    assert_nullable_instant,
    assert_nullable_int,
    assert_uuid,
    normalize_instant,
)


def field_label(info: ValidationInfo) -> DomainLabel:
    """Arma la label del catálogo: `session` + `course_id` → `session.course_id`."""
    entity = info.config["title"] if info.config else ""
    return f"{entity}.{info.field_name}"  # type: ignore[return-value]


def _uuid(value: object, info: ValidationInfo) -> str:
    return assert_uuid(value, field_label(info))


def _instant(value: object, info: ValidationInfo) -> str:
    label = field_label(info)
    return normalize_instant(assert_instant(value, label), label)


def _nullable_instant(value: object, info: ValidationInfo) -> str | None:
    label = field_label(info)
    instant = assert_nullable_instant(value, label)
    return None if instant is None else normalize_instant(instant, label)


def _non_negative_int(value: object, info: ValidationInfo) -> int:
    label = field_label(info)
    number = assert_int(value, label)
    if number < 0:
        fail(label, "non_negative")
    return number


def _nullable_non_negative_int(value: object, info: ValidationInfo) -> int | None:
    label = field_label(info)
    number = assert_nullable_int(value, label)
    if number is not None and number < 0:
        fail(label, "non_negative")
    return number


def one_of(options: tuple[str, ...]):
    """Valida que el valor es uno de `options`; si no, reason `format`."""

    def check(value: object, info: ValidationInfo) -> str:
        label = field_label(info)
        text = assert_non_empty_string(value, label)
        if text not in options:
            fail(label, "format")
        return text

    return BeforeValidator(check)


def nullable_one_of(options: tuple[str, ...]):
    """Como `one_of`, pero acepta `None`."""

    def check(value: object, info: ValidationInfo) -> str | None:
        if value is None:
            return None
        label = field_label(info)
        text = assert_non_empty_string(value, label)
        if text not in options:
            fail(label, "format")
        return text

    return BeforeValidator(check)


Uuid = Annotated[str, BeforeValidator(_uuid)]
Instant = Annotated[str, BeforeValidator(_instant)]
NullableInstant = Annotated[str | None, BeforeValidator(_nullable_instant)]
NonNegativeInt = Annotated[int, BeforeValidator(_non_negative_int)]
NullableNonNegativeInt = Annotated[
    int | None,
    BeforeValidator(_nullable_non_negative_int),
]
