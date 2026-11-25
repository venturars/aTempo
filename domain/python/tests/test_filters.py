import unittest

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.retrieve_all_attendances_by_session import (
    retrieve_all_attendances_by_session,
)
from python_domain.attendance.remove_attendance import remove_attendance
from python_domain.errors import ValidationError
from python_domain.session.add_session import add_session
from python_domain.session.remove_session import remove_session
from python_domain.session.retrieve_all_sessions_by_course import retrieve_all_sessions_by_course
from python_domain.session.retrieve_all_sessions_by_professor import (
    retrieve_all_sessions_by_professor,
)

from helpers import (
    COURSE_ID,
    OTHER_ID,
    PROFESSOR_ID,
    STUDENT_ID,
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
            ValidationError,
            "session.course_id debe ser un uuid",
        ):
            retrieve_all_sessions_by_course({"course_id": "no-es-uuid"})

    def test_does_not_query_when_filter_or_delete_id_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.professor_id debe ser un uuid",
        ):
            retrieve_all_sessions_by_professor({"professor_id": "no-es-uuid"})
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.session_id debe ser un uuid",
        ):
            retrieve_all_attendances_by_session({"session_id": "no-es-uuid"})
        with self.assertRaisesRegex(ValidationError, "session.id debe ser un uuid"):
            remove_session({"id": "no-es-uuid"})
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.session_id debe ser un uuid",
        ):
            remove_attendance({
                "session_id": "no-es-uuid",
                "student_id": STUDENT_ID,
            })
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.student_id debe ser un uuid",
        ):
            remove_attendance({
                "session_id": COURSE_ID,
                "student_id": "no-es-uuid",
            })

    def test_lists_sessions_by_course_and_professor(self) -> None:
        matching = add_session({"session": valid_session_input})["session"]
        other = add_session({
            "session": {**valid_session_input, "course_id": OTHER_ID},
        })["session"]
        self.assertEqual(
            retrieve_all_sessions_by_course({"course_id": COURSE_ID})["sessions"],
            [matching],
        )
        by_professor = retrieve_all_sessions_by_professor({
            "professor_id": PROFESSOR_ID,
        })["sessions"]
        self.assertCountEqual(by_professor, [matching, other])

    def test_lists_when_filter_ids_differ_only_by_case(self) -> None:
        matching = add_session({"session": valid_session_input})["session"]
        row = add_attendance({
            "attendance": {**valid_attendance, "session_id": matching["id"]},
        })["attendance"]
        self.assertEqual(
            retrieve_all_sessions_by_course({"course_id": COURSE_ID.upper()})["sessions"],
            [matching],
        )
        self.assertEqual(
            retrieve_all_sessions_by_professor({
                "professor_id": PROFESSOR_ID.upper(),
            })["sessions"],
            [matching],
        )
        self.assertEqual(
            retrieve_all_attendances_by_session({
                "session_id": matching["id"].upper(),
            })["attendances"],
            [row],
        )

    def test_lists_attendances_by_session(self) -> None:
        session = add_session({"session": valid_session_input})["session"]
        row = add_attendance({
            "attendance": {**valid_attendance, "session_id": session["id"]},
        })["attendance"]
        self.assertEqual(
            retrieve_all_attendances_by_session({
                "session_id": session["id"],
            })["attendances"],
            [row],
        )
        self.assertEqual(
            retrieve_all_attendances_by_session({"session_id": OTHER_ID})["attendances"],
            [],
        )


if __name__ == "__main__":
    unittest.main()
