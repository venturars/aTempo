import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.list_attendances import list_attendances
from python_domain.attendance.remove_attendance import remove_attendance
from python_domain.attendance.update_attendance import update_attendance
from python_domain.session.create_session import create_session
from python_domain.session.delete_session import delete_session
from python_domain.session.get_session_by_id import get_session_by_id
from python_domain.session.list_sessions import list_sessions
from python_domain.session.update_session import update_session

from helpers import (
    OTHER_ID,
    SESSION_ID,
    STUDENT_ID,
    close_memory_db,
    open_memory_db,
    valid_attendance,
    valid_session_input,
)


class WriteTests(unittest.TestCase):
    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_does_not_write_when_create_input_is_missing_a_field(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.course_id debe ser un string no vacío",
        ):
            create_session({"status": "open"})
        self.assertEqual(list_sessions(), [])

    def test_does_not_write_when_late_after_minutes_does_not_fit(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.late_after_minutes no cabe en un entero de 64 bits",
        ):
            create_session({**valid_session_input, "late_after_minutes": 2**63})
        self.assertEqual(list_sessions(), [])

    def test_stores_offset_dates_as_utc(self) -> None:
        created = create_session({
            **valid_session_input,
            "start_at": "2026-01-01T10:00:00+02:00",
            "end_at": "2026-01-01T09:00:00Z",
        })
        self.assertEqual(created["start_at"], "2026-01-01T08:00:00.000Z")
        self.assertEqual(created["end_at"], "2026-01-01T09:00:00.000Z")
        found = get_session_by_id(created["id"])
        self.assertEqual(found, created)

    def test_creates_and_updates_a_session(self) -> None:
        created = create_session(valid_session_input)
        self.assertEqual(created["status"], "open")
        updated = update_session({
            **created,
            "status": "closed",
            "closed_at": "2026-01-01T12:05:00.000Z",
        })
        self.assertIsNotNone(updated)
        assert updated is not None
        self.assertEqual(updated["status"], "closed")
        self.assertEqual(updated["closed_at"], "2026-01-01T12:05:00.000Z")

    def test_update_returns_none_when_missing(self) -> None:
        missing = update_session({
            **valid_session_input,
            "id": OTHER_ID,
            "status": "closed",
            "closed_at": "2026-01-01T12:05:00.000Z",
        })
        self.assertIsNone(missing)

    def test_update_attendance_returns_none_when_missing(self) -> None:
        session = create_session(valid_session_input)
        missing = update_attendance({
            **valid_attendance,
            "session_id": session["id"],
            "student_id": OTHER_ID,
        })
        self.assertIsNone(missing)

    def test_updates_when_ids_differ_only_by_case(self) -> None:
        created = create_session(valid_session_input)
        updated = update_session({
            **created,
            "id": created["id"].upper(),
            "expected_count": 21,
        })
        assert updated is not None
        self.assertEqual(updated["id"], created["id"])
        self.assertEqual(updated["expected_count"], 21)
        row = add_attendance({
            **valid_attendance,
            "session_id": created["id"],
        })
        attendance = update_attendance({
            **row,
            "session_id": created["id"].upper(),
            "student_id": STUDENT_ID.upper(),
            "status": "present_late",
        })
        assert attendance is not None
        self.assertEqual(attendance["session_id"], created["id"])
        self.assertEqual(attendance["student_id"], STUDENT_ID)
        self.assertEqual(attendance["status"], "present_late")

    def test_adds_updates_and_removes_attendance(self) -> None:
        session = create_session(valid_session_input)
        created = add_attendance({
            **valid_attendance,
            "session_id": session["id"],
        })
        self.assertEqual(created["status"], "present")
        updated = update_attendance({
            **created,
            "status": "present_late",
        })
        self.assertIsNotNone(updated)
        assert updated is not None
        self.assertEqual(updated["status"], "present_late")
        self.assertTrue(
            remove_attendance(session["id"], STUDENT_ID),
        )
        self.assertFalse(
            remove_attendance(session["id"], STUDENT_ID),
        )

    def test_deletes_attendances_before_the_session(self) -> None:
        session = create_session(valid_session_input)
        add_attendance({**valid_attendance, "session_id": session["id"]})
        self.assertTrue(delete_session(session["id"]))
        self.assertIsNone(get_session_by_id(session["id"]))
        self.assertEqual(list_attendances(), [])

    def test_delete_reports_false_when_the_session_is_missing(self) -> None:
        self.assertFalse(delete_session(SESSION_ID))

    def test_deletes_when_the_id_differs_only_by_case(self) -> None:
        session = create_session(valid_session_input)
        self.assertTrue(delete_session(session["id"].upper()))
        self.assertIsNone(get_session_by_id(session["id"]))

    def test_removes_attendance_when_ids_differ_only_by_case(self) -> None:
        session = create_session(valid_session_input)
        add_attendance({**valid_attendance, "session_id": session["id"]})
        self.assertTrue(
            remove_attendance(session["id"].upper(), STUDENT_ID.upper()),
        )
        self.assertEqual(list_attendances(), [])


if __name__ == "__main__":
    unittest.main()
