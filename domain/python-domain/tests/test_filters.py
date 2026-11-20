import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.list_attendances_by_session import (
    list_attendances_by_session,
)
from python_domain.session.create_session import create_session
from python_domain.session.list_sessions_by_course import list_sessions_by_course
from python_domain.session.list_sessions_by_professor import (
    list_sessions_by_professor,
)

from helpers import (
    COURSE_ID,
    OTHER_ID,
    PROFESSOR_ID,
    close_memory_db,
    open_memory_db,
    valid_attendance,
    valid_session_input,
)


class FilterTests(unittest.TestCase):
    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_does_not_query_when_course_id_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.course_id debe ser un uuid",
        ):
            list_sessions_by_course("no-es-uuid")

    def test_lists_sessions_by_course_and_professor(self) -> None:
        matching = create_session(valid_session_input)
        other = create_session({**valid_session_input, "course_id": OTHER_ID})
        self.assertEqual(list_sessions_by_course(COURSE_ID), [matching])
        by_professor = list_sessions_by_professor(PROFESSOR_ID)
        self.assertEqual(by_professor, [matching, other])

    def test_lists_when_filter_ids_differ_only_by_case(self) -> None:
        matching = create_session(valid_session_input)
        row = add_attendance({**valid_attendance, "session_id": matching["id"]})
        self.assertEqual(list_sessions_by_course(COURSE_ID.upper()), [matching])
        self.assertEqual(
            list_sessions_by_professor(PROFESSOR_ID.upper()),
            [matching],
        )
        self.assertEqual(
            list_attendances_by_session(matching["id"].upper()),
            [row],
        )

    def test_lists_attendances_by_session(self) -> None:
        session = create_session(valid_session_input)
        row = add_attendance({**valid_attendance, "session_id": session["id"]})
        self.assertEqual(list_attendances_by_session(session["id"]), [row])
        self.assertEqual(list_attendances_by_session(OTHER_ID), [])


if __name__ == "__main__":
    unittest.main()
