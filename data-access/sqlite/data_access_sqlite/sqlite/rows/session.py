from typing import cast

from data_access_sqlite.shared.types.session import Session, SessionStatus
from data_access_sqlite.shared.validation.assert_values import (
    assert_int,
    assert_non_empty_string,
    assert_nullable_int,
    assert_nullable_string,
    assert_row,
    assert_string,
)


def session_from_row(value: object) -> Session:
    """Lee una fila de session que viene de SQLite.

    Solo comprueba la forma. El esquema ya garantiza el formato de los
    instantes, `end_at > start_at`, el estado y su `closed_at`. Un valor que la
    entrada no aceptaría (un id que no es uuid, una fecha como 2026-02-30, un
    entero negativo) no rompe el listado entero. El id sale tal como está
    guardado. `model_construct` crea el modelo sin volver a validarlo.
    """
    row = assert_row(value, "session")
    return Session.model_construct(
        id=assert_string(row.get("id"), "session.id"),
        course_id=assert_string(row.get("course_id"), "session.course_id"),
        professor_id=assert_string(row.get("professor_id"), "session.professor_id"),
        start_at=assert_non_empty_string(row.get("start_at"), "session.start_at"),
        end_at=assert_non_empty_string(row.get("end_at"), "session.end_at"),
        status=cast(
            SessionStatus,
            assert_string(row.get("status"), "session.status"),
        ),
        closed_at=assert_nullable_string(row.get("closed_at"), "session.closed_at"),
        late_after_minutes=assert_int(
            row.get("late_after_minutes"),
            "session.late_after_minutes",
        ),
        expected_count=assert_nullable_int(
            row.get("expected_count"),
            "session.expected_count",
        ),
    )
