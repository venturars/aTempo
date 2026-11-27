import unittest

from atempo_errors import ValidationError
from pydantic import BaseModel, ConfigDict

from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.types.session import Session, SessionCreate
from data_access_python.shared.validation.assert_values import UUID_RE
from data_access_python.shared.validation.model import validate_model

from helpers import valid_attendance, valid_session_input


class TypeTests(unittest.TestCase):
    def test_accepts_a_complete_session_input(self) -> None:
        validate_model(SessionCreate, valid_session_input)

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
            ValidationError,
            "session.course_id debe ser un string no vacío",
        ):
            validate_model(SessionCreate, incomplete)

    def test_rejects_end_at_before_start_at(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.end_at debe ser posterior a session.start_at",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": valid_session_input["end_at"],
                "end_at": valid_session_input["start_at"],
            })

    def test_rejects_end_at_equal_to_start_at_after_normalizing_milliseconds(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.end_at debe ser posterior a session.start_at",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": "2026-01-01T10:00:00.0001Z",
                "end_at": "2026-01-01T10:00:00.0009Z",
            })

    def test_rejects_a_start_at_without_timezone(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.start_at debe ser una fecha con zona horaria",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": "2026-01-01T10:00",
            })

    def test_rejects_an_instant_that_overflows_utc(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            r"session\.start_at debe ser una fecha$",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": "0001-01-01T00:30:00.000+01:00",
                "end_at": "0001-01-01T02:00:00.000Z",
            })
        with self.assertRaisesRegex(
            ValidationError,
            r"session\.end_at debe ser una fecha$",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": "9999-12-31T20:00:00.000Z",
                "end_at": "9999-12-31T23:30:00.000-01:00",
            })

    def test_rejects_an_impossible_start_at(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            r"session\.start_at debe ser una fecha$",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "start_at": "2026-02-30T08:00:00.000Z",
            })

    def test_rejects_closed_without_closed_at(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.closed_at es obligatorio si el estado es closed",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "status": "closed",
                "closed_at": None,
            })

    def test_rejects_open_with_closed_at(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.closed_at solo puede ir con el estado closed",
        ):
            validate_model(SessionCreate, {
                **valid_session_input,
                "closed_at": "2026-01-01T12:05:00.000Z",
            })

    def test_rejects_negative_late_after_minutes(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.late_after_minutes debe ser un entero no negativo",
        ):
            validate_model(SessionCreate, {**valid_session_input, "late_after_minutes": -1})

    def test_rejects_an_integer_sqlite_cannot_store(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.late_after_minutes no cabe en un entero de 64 bits",
        ):
            validate_model(SessionCreate, {**valid_session_input, "late_after_minutes": 2**63})
        with self.assertRaisesRegex(
            ValidationError,
            "session.expected_count no cabe en un entero de 64 bits",
        ):
            validate_model(SessionCreate, {**valid_session_input, "expected_count": 2**63})

    def test_accepts_the_largest_sqlite_integer(self) -> None:
        body = validate_model(SessionCreate, {
            **valid_session_input,
            "late_after_minutes": 2**63 - 1,
            "expected_count": 2**63 - 1,
        })
        self.assertEqual(body.late_after_minutes, 2**63 - 1)
        self.assertEqual(body.expected_count, 2**63 - 1)

    def test_accepts_closing_without_closed_at(self) -> None:
        body = validate_model(SessionCreate, {
            **valid_session_input,
            "status": "closing",
            "closed_at": None,
        })
        self.assertEqual(body.status, "closing")
        self.assertIsNone(body.closed_at)

    def test_keeps_four_digit_years_before_1000(self) -> None:
        body = validate_model(SessionCreate, {
            **valid_session_input,
            "start_at": "0999-12-31T23:00:00.000Z",
            "end_at": "0999-12-31T23:59:59.000Z",
        })
        self.assertEqual(body.start_at, "0999-12-31T23:00:00.000Z")
        self.assertEqual(body.end_at, "0999-12-31T23:59:59.000Z")

    def test_rejects_an_invented_session_status(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "session.status debe ser open, closing o closed",
        ):
            validate_model(SessionCreate, {**valid_session_input, "status": "paused"})

    def test_rejects_session_id_that_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(ValidationError, "session.id debe ser un uuid"):
            validate_model(Session, {**valid_session_input, "id": "no-es-uuid"})

    def test_rejects_uuid_with_trailing_newline(self) -> None:
        student_id = valid_attendance["student_id"] + "\n"
        with self.assertRaisesRegex(
            ValidationError, "attendance.student_id debe ser un uuid"
        ):
            validate_model(Attendance, {**valid_attendance, "student_id": student_id})

    def test_exported_uuid_pattern_matches_only_the_whole_text(self) -> None:
        uuid = valid_attendance["student_id"]
        self.assertIsNotNone(UUID_RE.match(uuid))
        self.assertIsNone(UUID_RE.match(uuid + "\n"))
        self.assertIsNone(UUID_RE.match(uuid + "XYZ"))

    def test_rejects_instant_with_trailing_newline(self) -> None:
        start_at = valid_session_input["start_at"] + "\n"
        with self.assertRaisesRegex(
            ValidationError, "session.start_at debe ser una fecha con zona horaria"
        ):
            validate_model(SessionCreate, {**valid_session_input, "start_at": start_at})

    def test_accepts_attendance(self) -> None:
        validate_model(Attendance, valid_attendance)

    def test_rejects_invented_attendance_status(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.status debe ser present, present_late, absent o notified_absence",
        ):
            validate_model(Attendance, {**valid_attendance, "status": "late"})

    def test_rejects_invented_check_in_method(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.check_in_method debe ser button, qr o null",
        ):
            validate_model(Attendance, {**valid_attendance, "check_in_method": "nfc"})

    def test_accepts_null_check_in_method(self) -> None:
        validate_model(Attendance, {
            **valid_attendance,
            "status": "absent",
            "check_in_method": None,
            "checked_in_at": None,
        })

    def test_normalizes_offset_instants_to_utc(self) -> None:
        body = validate_model(SessionCreate, {
            **valid_session_input,
            "start_at": "2026-01-01T10:00:00+02:00",
            "end_at": "2026-01-01T09:00:00Z",
        })
        self.assertEqual(body.start_at, "2026-01-01T08:00:00.000Z")
        self.assertEqual(body.end_at, "2026-01-01T09:00:00.000Z")

    def test_lowercases_uuids(self) -> None:
        body = validate_model(SessionCreate, {
            **valid_session_input,
            "course_id": "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
        })
        self.assertEqual(body.course_id, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        row = validate_model(Attendance, {
            **valid_attendance,
            "session_id": "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
            "student_id": "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        })
        self.assertEqual(row.session_id, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        self.assertEqual(row.student_id, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

    def test_rejects_absent_with_check_in(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.check_in_method solo puede ir con present o present_late",
        ):
            validate_model(Attendance, {
                **valid_attendance,
                "status": "absent",
                "check_in_method": "qr",
                "checked_in_at": "2026-01-01T10:05:00.000Z",
            })

    def test_rejects_present_without_check_in(self) -> None:
        with self.assertRaisesRegex(
            ValidationError,
            "attendance.check_in_method es obligatorio si el estado es present o present_late",
        ):
            validate_model(Attendance, {
                **valid_attendance,
                "check_in_method": None,
                "checked_in_at": None,
            })


class ModelTests(unittest.TestCase):
    def test_does_not_convert_a_string_into_an_integer(self) -> None:
        with self.assertRaises(ValidationError) as caught:
            validate_model(SessionCreate, {**valid_session_input, "late_after_minutes": "1"})
        self.assertEqual(caught.exception.id, "session.late_after_minutes.integer")

    def test_does_not_accept_a_boolean_as_an_integer(self) -> None:
        with self.assertRaises(ValidationError) as caught:
            validate_model(SessionCreate, {**valid_session_input, "expected_count": True})
        self.assertEqual(caught.exception.id, "session.expected_count.integer")

    def test_a_validated_model_cannot_be_changed(self) -> None:
        session = validate_model(SessionCreate, valid_session_input)
        with self.assertRaises(Exception):
            session.status = "closed"  # type: ignore[misc]
        self.assertEqual(session.status, valid_session_input["status"])

    def test_an_unexpected_pydantic_error_leaves_as_a_catalog_error(self) -> None:
        class PlainModel(BaseModel):
            model_config = ConfigDict(title="session", strict=True)

            course_id: int

        with self.assertRaises(ValidationError) as caught:
            validate_model(PlainModel, {"course_id": "uno"})
        error = caught.exception
        self.assertEqual(error.id, "session.course_id.format")
        self.assertEqual(error.entity, "session")
        self.assertEqual(error.field, "course_id")
        self.assertEqual(str(error), "session.course_id tiene un formato inválido")


if __name__ == "__main__":
    unittest.main()
