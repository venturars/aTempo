import unittest

from python_domain.attendance.retrieve_all_attendances_by_session import (
    retrieve_all_attendances_by_session,
)
from python_domain.errors import ValidationError
from python_domain.session.add_session import add_session
from python_domain.session.retrieve_session_by_id import retrieve_session_by_id
from python_domain.session.retrieve_all_sessions import retrieve_all_sessions
from python_domain.sqlite.pool import query

from helpers import (
    COURSE_ID,
    PROFESSOR_ID,
    SESSION_ID,
    close_memory_db,
    open_memory_db,
    valid_session_input,
)


class ReadTests(unittest.TestCase):
    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_does_not_query_when_id_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(ValidationError, "session.id debe ser un uuid"):
            retrieve_session_by_id({"id": "no-es-uuid"})

    def test_returns_none_when_session_does_not_exist(self) -> None:
        self.assertIsNone(retrieve_session_by_id({"id": SESSION_ID})["session"])

    def test_returns_a_session_after_create(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        found = retrieve_session_by_id({"id": created["id"]})["session"]
        self.assertEqual(found, created)

    def test_finds_a_session_when_the_id_differs_only_by_case(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        found = retrieve_session_by_id({"id": created["id"].upper()})["session"]
        self.assertEqual(found, created)

    def test_lists_sessions(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        self.assertEqual(retrieve_all_sessions()["sessions"], [created])


def insert_raw_session(
    session_id: str,
    start_at: str,
    end_at: str,
    late_after_minutes: object,
) -> None:
    """Guarda una fila que el esquema acepta sin pasar por el SDK."""
    query(
        """INSERT INTO session (id, course_id, professor_id, start_at, end_at,
        status, closed_at, late_after_minutes, expected_count)
        VALUES (:id, :course_id, :professor_id, :start_at, :end_at, 'open',
        NULL, :late_after_minutes, NULL)""",
        {
            "id": session_id,
            "course_id": COURSE_ID,
            "professor_id": PROFESSOR_ID,
            "start_at": start_at,
            "end_at": end_at,
            "late_after_minutes": late_after_minutes,  # type: ignore[dict-item]
        },
    )


class StoredRowReadTests(unittest.TestCase):
    """Una fila guardada que la entrada no aceptaría no rompe el listado."""

    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_lists_a_row_with_a_legacy_id_and_a_negative_integer(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        insert_raw_session(
            "LEGACY-1",
            "2026-01-01T10:00:00.000Z",
            "2026-01-01T11:00:00.000Z",
            -1,
        )
        sessions = retrieve_all_sessions()["sessions"]
        self.assertEqual(len(sessions), 2)
        self.assertIn(created, sessions)
        legacy = next(s for s in sessions if s["id"] == "LEGACY-1")
        self.assertEqual(legacy["late_after_minutes"], -1)

    def test_lists_a_row_with_a_date_that_does_not_exist(self) -> None:
        insert_raw_session(
            SESSION_ID,
            "2026-02-30T10:00:00.000Z",
            "2026-02-30T11:00:00.000Z",
            5,
        )
        [session] = retrieve_all_sessions()["sessions"]
        self.assertEqual(session["start_at"], "2026-02-30T10:00:00.000Z")

    def test_still_rejects_a_row_with_the_wrong_shape(self) -> None:
        insert_raw_session(
            SESSION_ID,
            "2026-01-01T10:00:00.000Z",
            "2026-01-01T11:00:00.000Z",
            "x",
        )
        with self.assertRaisesRegex(ValidationError, "late_after_minutes"):
            retrieve_all_sessions()

    def test_lists_an_attendance_with_a_legacy_student_id(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        query(
            """INSERT INTO attendance (session_id, student_id, status,
            check_in_method, checked_in_at)
            VALUES (:session_id, 'legacy-student', 'absent', NULL, NULL)""",
            {"session_id": created["id"]},
        )
        [attendance] = retrieve_all_attendances_by_session(
            {"session_id": created["id"]},
        )["attendances"]
        self.assertEqual(attendance["student_id"], "legacy-student")


if __name__ == "__main__":
    unittest.main()
