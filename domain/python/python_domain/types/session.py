from typing import Literal, TypedDict, cast

from python_domain.errors import DomainLabel, fail
from python_domain.types.assert_values import (
    assert_instant,
    assert_int,
    assert_non_empty_string,
    assert_nullable_instant,
    assert_nullable_int,
    assert_nullable_string,
    assert_row,
    assert_string,
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
    label: DomainLabel = "session.status",
) -> SessionStatus:
    text = assert_non_empty_string(value, label)
    if text not in SESSION_STATUSES:
        fail(label, "format")
    return cast(SessionStatus, text)


def assert_closed_at_matches_status(
    status: SessionStatus,
    closed_at: str | None,
) -> None:
    if status == "closed" and closed_at is None:
        fail("session.closed_at", "required")
    if status != "closed" and closed_at is not None:
        fail("session.closed_at", "forbidden")


def _session_fields(value: object) -> SessionCreate:
    if value is None or not isinstance(value, dict):
        fail("session", "object")

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
        fail("session.end_at", "order")
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
        fail("session.late_after_minutes", "non_negative")
    expected_count = assert_nullable_int(
        value.get("expected_count"),
        "session.expected_count",
    )
    if expected_count is not None and expected_count < 0:
        fail("session.expected_count", "non_negative")

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
        fail("session", "object")
    session_id = assert_uuid(value.get("id"), "session.id")
    body = _session_fields(value)
    return {"id": session_id, **body}


def assert_session_update(value: SessionUpdate) -> SessionUpdate:
    return assert_session(value)


def session_from_row(value: object) -> Session:
    """Lee una fila de session que viene de SQLite.

    Solo comprueba la forma. El esquema ya garantiza el formato de los
    instantes, `end_at > start_at`, el estado y su `closed_at`. Un valor que la
    entrada no aceptaría (un id que no es uuid, una fecha como 2026-02-30, un
    entero negativo) no rompe el listado entero. El id sale tal como está
    guardado.
    """
    row = assert_row(value, "session")
    return {
        "id": assert_string(row.get("id"), "session.id"),
        "course_id": assert_string(row.get("course_id"), "session.course_id"),
        "professor_id": assert_string(
            row.get("professor_id"),
            "session.professor_id",
        ),
        "start_at": assert_non_empty_string(row.get("start_at"), "session.start_at"),
        "end_at": assert_non_empty_string(row.get("end_at"), "session.end_at"),
        "status": cast(
            SessionStatus,
            assert_string(row.get("status"), "session.status"),
        ),
        "closed_at": assert_nullable_string(
            row.get("closed_at"),
            "session.closed_at",
        ),
        "late_after_minutes": assert_int(
            row.get("late_after_minutes"),
            "session.late_after_minutes",
        ),
        "expected_count": assert_nullable_int(
            row.get("expected_count"),
            "session.expected_count",
        ),
    }
