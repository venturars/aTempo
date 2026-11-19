import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.session.create_session import create_session

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


if __name__ == "__main__":
    unittest.main()
