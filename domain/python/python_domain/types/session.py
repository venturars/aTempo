from typing import Literal, TypedDict, cast

from python_domain.errors import ValidationError
from python_domain.types.assert_values import (
    assert_instant,
    assert_int,
    assert_non_empty_string,
    assert_nullable_instant,
    assert_nullable_int,
    assert_uuid,
    normalize_instant,
    truncate_to_milliseconds,
)

SESSION_STATUSES = ("open", "closing", "closed")
SessionStatus = Literal["open", "closing", "closed"]


class Session(TypedDict):
    id: str
    course_id: str
    professor_id: str
    start_at: str
    end_at: str
    status: SessionStatus
    closed_at: str | None
    late_after_minutes: int
    expected_count: int | None


class SessionCreate(TypedDict):
    course_id: str
    professor_id: str
    start_at: str
    end_at: str
    status: SessionStatus
    closed_at: str | None
    late_after_minutes: int
    expected_count: int | None


SessionUpdate = Session


def assert_session_status(
    value: object,
    label: str = "session.status",
) -> SessionStatus:
    text = assert_non_empty_string(value, label)
    if text not in SESSION_STATUSES:
        raise ValidationError(
            "session.status debe ser open, closing o closed",
            entity="session",
            field="status",
        )
    return cast(SessionStatus, text)


def assert_closed_at_matches_status(
    status: SessionStatus,
    closed_at: str | None,
) -> None:
    if status == "closed" and closed_at is None:
        raise ValidationError(
            "session.closed_at es obligatorio si el estado es closed",
            entity="session",
            field="closed_at",
        )
    if status != "closed" and closed_at is not None:
        raise ValidationError(
            "session.closed_at solo puede ir con el estado closed",
            entity="session",
            field="closed_at",
        )


def _session_fields(value: object) -> SessionCreate:
    if value is None or not isinstance(value, dict):
        raise ValidationError("session debe ser un objeto", entity="session")

    course_id = assert_uuid(value.get("course_id"), "session.course_id")
    professor_id = assert_uuid(value.get("professor_id"), "session.professor_id")
    start = truncate_to_milliseconds(
        assert_instant(value.get("start_at"), "session.start_at"),
        "session.start_at",
    )
    end = truncate_to_milliseconds(
        assert_instant(value.get("end_at"), "session.end_at"),
        "session.end_at",
    )
    if not (end > start):
        raise ValidationError(
            "session.end_at debe ser posterior a session.start_at",
            entity="session",
            field="end_at",
        )
    start_at = normalize_instant(start, "session.start_at")
    end_at = normalize_instant(end, "session.end_at")
    status = assert_session_status(value.get("status"))
    closed = assert_nullable_instant(value.get("closed_at"), "session.closed_at")
    closed_at = (
        None if closed is None else normalize_instant(closed, "session.closed_at")
    )
    assert_closed_at_matches_status(status, closed_at)
    late_after_minutes = assert_int(
        value.get("late_after_minutes"),
        "session.late_after_minutes",
    )
    if late_after_minutes < 0:
        raise ValidationError(
            "session.late_after_minutes debe ser un entero no negativo",
            entity="session",
            field="late_after_minutes",
        )
    expected_count = assert_nullable_int(
        value.get("expected_count"),
        "session.expected_count",
    )
    if expected_count is not None and expected_count < 0:
        raise ValidationError(
            "session.expected_count debe ser un entero no negativo",
            entity="session",
            field="expected_count",
        )

    return {
        "course_id": course_id,
        "professor_id": professor_id,
        "start_at": start_at,
        "end_at": end_at,
        "status": status,
        "closed_at": closed_at,
        "late_after_minutes": late_after_minutes,
        "expected_count": expected_count,
    }


def assert_session_create(value: SessionCreate) -> SessionCreate:
    return _session_fields(value)


def assert_session(value: Session) -> Session:
    if value is None or not isinstance(value, dict):
        raise ValidationError("session debe ser un objeto", entity="session")
    session_id = assert_uuid(value.get("id"), "session.id")
    body = _session_fields(value)
    return {"id": session_id, **body}


def assert_session_update(value: SessionUpdate) -> SessionUpdate:
    return assert_session(value)
