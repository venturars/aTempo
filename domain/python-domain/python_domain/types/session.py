from typing import Literal, TypedDict

from python_domain.types.assert_values import (
    assert_instant,
    assert_int,
    assert_non_empty_string,
    assert_nullable_instant,
    assert_nullable_int,
    assert_uuid,
    normalize_instant,
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


class SessionInput(TypedDict):
    course_id: str
    professor_id: str
    start_at: str
    end_at: str
    status: SessionStatus
    closed_at: str | None
    late_after_minutes: int
    expected_count: int | None


def assert_session_status(value: object, label: str = "session.status") -> SessionStatus:
    text = assert_non_empty_string(value, label)
    if text not in SESSION_STATUSES:
        raise ValueError("session.status debe ser open, closing o closed")
    return text  # type: ignore[return-value]


def assert_closed_at_matches_status(
    status: SessionStatus,
    closed_at: str | None,
) -> None:
    if status == "closed" and closed_at is None:
        raise ValueError("session.closed_at es obligatorio si el estado es closed")
    if status != "closed" and closed_at is not None:
        raise ValueError("session.closed_at solo puede ir con el estado closed")


def assert_session_input(value: object) -> SessionInput:
    if value is None or not isinstance(value, dict):
        raise ValueError("session debe ser un objeto")

    course_id = assert_uuid(value.get("course_id"), "session.course_id")
    professor_id = assert_uuid(value.get("professor_id"), "session.professor_id")
    start_at = normalize_instant(
        assert_instant(value.get("start_at"), "session.start_at"),
    )
    end_at = normalize_instant(
        assert_instant(value.get("end_at"), "session.end_at"),
    )
    if not (
        assert_instant(end_at, "session.end_at")
        > assert_instant(start_at, "session.start_at")
    ):
        raise ValueError("session.end_at debe ser posterior a session.start_at")
    status = assert_session_status(value.get("status"))
    closed = assert_nullable_instant(value.get("closed_at"), "session.closed_at")
    closed_at = None if closed is None else normalize_instant(closed)
    assert_closed_at_matches_status(status, closed_at)
    late_after_minutes = assert_int(
        value.get("late_after_minutes"),
        "session.late_after_minutes",
    )
    if late_after_minutes < 0:
        raise ValueError("session.late_after_minutes debe ser un entero no negativo")
    expected_count = assert_nullable_int(
        value.get("expected_count"),
        "session.expected_count",
    )
    if expected_count is not None and expected_count < 0:
        raise ValueError("session.expected_count debe ser un entero no negativo")

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


def assert_session(value: object) -> Session:
    if value is None or not isinstance(value, dict):
        raise ValueError("session debe ser un objeto")
    session_id = assert_uuid(value.get("id"), "session.id")
    body = assert_session_input(value)
    return {"id": session_id, **body}
