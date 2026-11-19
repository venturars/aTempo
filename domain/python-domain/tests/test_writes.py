import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.list_attendances import list_attendances
from python_domain.attendance.remove_attendance import remove_attendance
from python_domain.attendance.update_attendance import update_attendance
from python_domain.session.create_session import create_session
from python_domain.session.delete_session import delete_session
from python_domain.session.get_session_by_id import get_session_by_id
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
        self.assertEqual(list_attendances(), [])

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


if __name__ == "__main__":
    unittest.main()
