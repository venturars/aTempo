import unittest

from python_domain.types.attendance import assert_attendance
from python_domain.types.session import assert_session, assert_session_input

from helpers import valid_attendance, valid_session_input


class TypeTests(unittest.TestCase):
    def test_accepts_a_complete_session_input(self) -> None:
        assert_session_input(valid_session_input)

    def test_rejects_a_session_missing_a_field(self) -> None:
        incomplete = {
            "professor_id": valid_session_input["professor_id"],
            "start_at": valid_session_input["start_at"],
            "end_at": valid_session_input["end_at"],
            "status": valid_session_input["status"],
            "closed_at": None,
            "late_after_minutes": 10,
            "expected_count": 20,
        }
        with self.assertRaisesRegex(
            ValueError,
            "session.course_id debe ser un string no vacío",
        ):
            assert_session_input(incomplete)

    def test_rejects_end_at_before_start_at(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.end_at debe ser posterior a session.start_at",
        ):
            assert_session_input({
                **valid_session_input,
                "start_at": valid_session_input["end_at"],
                "end_at": valid_session_input["start_at"],
            })

    def test_rejects_end_at_equal_to_start_at_after_normalizing_milliseconds(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.end_at debe ser posterior a session.start_at",
        ):
            assert_session_input({
                **valid_session_input,
                "start_at": "2026-01-01T10:00:00.0001Z",
                "end_at": "2026-01-01T10:00:00.0009Z",
            })

    def test_rejects_a_start_at_without_timezone(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.start_at debe ser una fecha con zona horaria",
        ):
            assert_session_input({
                **valid_session_input,
                "start_at": "2026-01-01T10:00",
            })

    def test_rejects_an_impossible_start_at(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            r"session\.start_at debe ser una fecha$",
        ):
            assert_session_input({
                **valid_session_input,
                "start_at": "2026-02-30T08:00:00.000Z",
            })

    def test_rejects_closed_without_closed_at(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.closed_at es obligatorio si el estado es closed",
        ):
            assert_session_input({
                **valid_session_input,
                "status": "closed",
                "closed_at": None,
            })

    def test_rejects_open_with_closed_at(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.closed_at solo puede ir con el estado closed",
        ):
            assert_session_input({
                **valid_session_input,
                "closed_at": "2026-01-01T12:05:00.000Z",
            })

    def test_rejects_negative_late_after_minutes(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.late_after_minutes debe ser un entero no negativo",
        ):
            assert_session_input({**valid_session_input, "late_after_minutes": -1})

    def test_accepts_closing_without_closed_at(self) -> None:
        body = assert_session_input({
            **valid_session_input,
            "status": "closing",
            "closed_at": None,
        })
        self.assertEqual(body["status"], "closing")
        self.assertIsNone(body["closed_at"])

    def test_keeps_four_digit_years_before_1000(self) -> None:
        body = assert_session_input({
            **valid_session_input,
            "start_at": "0999-12-31T23:00:00.000Z",
            "end_at": "0999-12-31T23:59:59.000Z",
        })
        self.assertEqual(body["start_at"], "0999-12-31T23:00:00.000Z")
        self.assertEqual(body["end_at"], "0999-12-31T23:59:59.000Z")

    def test_rejects_an_invented_session_status(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "session.status debe ser open, closing o closed",
        ):
            assert_session_input({**valid_session_input, "status": "paused"})

    def test_rejects_session_id_that_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(ValueError, "session.id debe ser un uuid"):
            assert_session({**valid_session_input, "id": "no-es-uuid"})

    def test_accepts_attendance(self) -> None:
        assert_attendance(valid_attendance)

    def test_rejects_invented_attendance_status(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "attendance.status debe ser present, present_late, absent o notified_absence",
        ):
            assert_attendance({**valid_attendance, "status": "late"})

    def test_rejects_invented_check_in_method(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "attendance.check_in_method debe ser button, qr o null",
        ):
            assert_attendance({**valid_attendance, "check_in_method": "nfc"})

    def test_accepts_null_check_in_method(self) -> None:
        assert_attendance({
            **valid_attendance,
            "status": "absent",
            "check_in_method": None,
            "checked_in_at": None,
        })

    def test_normalizes_offset_instants_to_utc(self) -> None:
        body = assert_session_input({
            **valid_session_input,
            "start_at": "2026-01-01T10:00:00+02:00",
            "end_at": "2026-01-01T09:00:00Z",
        })
        self.assertEqual(body["start_at"], "2026-01-01T08:00:00.000Z")
        self.assertEqual(body["end_at"], "2026-01-01T09:00:00.000Z")

    def test_lowercases_uuids(self) -> None:
        body = assert_session_input({
            **valid_session_input,
            "course_id": "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
        })
        self.assertEqual(body["course_id"], "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        row = assert_attendance({
            **valid_attendance,
            "session_id": "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
            "student_id": "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        })
        self.assertEqual(row["session_id"], "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        self.assertEqual(row["student_id"], "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    def test_rejects_absent_with_check_in(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "attendance.check_in_method solo puede ir con present o present_late",
        ):
            assert_attendance({
                **valid_attendance,
                "status": "absent",
                "check_in_method": "qr",
                "checked_in_at": "2026-01-01T10:05:00.000Z",
            })

    def test_rejects_present_without_check_in(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "attendance.check_in_method es obligatorio si el estado es present o present_late",
        ):
            assert_attendance({
                **valid_attendance,
                "check_in_method": None,
                "checked_in_at": None,
            })


if __name__ == "__main__":
    unittest.main()
