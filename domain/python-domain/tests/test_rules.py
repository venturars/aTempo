import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.list_attendances import list_attendances
from python_domain.attendance.update_attendance import update_attendance
from python_domain.session.create_session import create_session
from python_domain.session.get_session_by_id import get_session_by_id
from python_domain.session.update_session import update_session

from helpers import (
    OTHER_ID,
    close_memory_db,
    open_memory_db,
    valid_attendance,
    valid_session_input,
)


class RuleTests(unittest.TestCase):
    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_does_not_insert_when_dates_fail(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.end_at debe ser posterior a session.start_at",
        ):
            create_session({
                **valid_session_input,
                "start_at": valid_session_input["end_at"],
                "end_at": valid_session_input["start_at"],
            })

    def test_does_not_insert_attendance_when_session_does_not_exist(self) -> None:
        with self.assertRaisesRegex(ValueError, "session no existe"):
            add_attendance({**valid_attendance, "session_id": OTHER_ID})

    def test_does_not_insert_a_repeated_attendance(self) -> None:
        session = create_session(valid_session_input)
        add_attendance({**valid_attendance, "session_id": session["id"]})
        with self.assertRaisesRegex(ValueError, "attendance ya existe"):
            add_attendance({**valid_attendance, "session_id": session["id"]})

    def test_treats_uppercase_student_id_as_the_same_attendance(self) -> None:
        session = create_session(valid_session_input)
        student_id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        add_attendance({
            **valid_attendance,
            "session_id": session["id"],
            "student_id": student_id.upper(),
            "status": "absent",
            "check_in_method": None,
            "checked_in_at": None,
        })
        with self.assertRaisesRegex(ValueError, "attendance ya existe"):
            add_attendance({
                **valid_attendance,
                "session_id": session["id"],
                "student_id": student_id,
            })
        rows = list_attendances()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["student_id"], student_id)

    def test_does_not_insert_check_in_outside_the_session(self) -> None:
        session = create_session(valid_session_input)
        with self.assertRaisesRegex(
            ValueError,
            "attendance.checked_in_at debe estar dentro de la sesión",
        ):
            add_attendance({
                **valid_attendance,
                "session_id": session["id"],
                "checked_in_at": "2026-01-01T09:00:00.000Z",
            })

    def test_does_not_update_check_in_outside_the_session(self) -> None:
        session = create_session(valid_session_input)
        created = add_attendance({
            **valid_attendance,
            "session_id": session["id"],
        })
        with self.assertRaisesRegex(
            ValueError,
            "attendance.checked_in_at debe estar dentro de la sesión",
        ):
            update_attendance({
                **created,
                "checked_in_at": "2026-01-01T09:00:00.000Z",
            })
        self.assertEqual(
            list_attendances(),
            [created],
        )

    def test_accepts_check_in_at_the_session_bounds(self) -> None:
        session = create_session(valid_session_input)
        at_start = add_attendance({
            **valid_attendance,
            "session_id": session["id"],
            "checked_in_at": session["start_at"],
        })
        self.assertEqual(at_start["checked_in_at"], session["start_at"])
        at_end = update_attendance({
            **at_start,
            "checked_in_at": session["end_at"],
        })
        assert at_end is not None
        self.assertEqual(at_end["checked_in_at"], session["end_at"])

    def test_does_not_shorten_the_session_past_a_stored_check_in(self) -> None:
        session = create_session(valid_session_input)
        add_attendance({**valid_attendance, "session_id": session["id"]})
        with self.assertRaisesRegex(
            ValueError,
            "attendance.checked_in_at debe estar dentro de la sesión",
        ):
            update_session({
                **session,
                "start_at": "2026-01-01T11:00:00.000Z",
                "end_at": "2026-01-01T12:00:00.000Z",
            })
        self.assertEqual(get_session_by_id(session["id"]), session)


if __name__ == "__main__":
    unittest.main()
