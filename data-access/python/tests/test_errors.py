import unittest
from pathlib import Path

from atempo_errors import (
    ConflictError,
    NotFoundError,
    PersistenceError,
    ValidationError,
)

from data_access_python.session.add_session import add_session
from data_access_python.shared.errors import domain_error, fail
from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.validation.model import validate_model
from data_access_python.sqlite.pool import query

from helpers import (
    OTHER_ID,
    close_memory_db,
    open_memory_db,
    valid_attendance,
    valid_session_input,
)

SRC = Path(__file__).resolve().parents[1] / "data_access_python"


class CatalogTests(unittest.TestCase):
    def tearDown(self) -> None:
        close_memory_db()

    def test_builds_id_kind_entity_and_field_from_label_and_reason(self) -> None:
        error = domain_error("attendance", "taken")
        self.assertIsInstance(error, ConflictError)
        self.assertEqual(error.id, "attendance.taken")
        self.assertEqual(error.kind, "CONFLICT")
        self.assertEqual(error.entity, "attendance")
        self.assertIsNone(error.field)
        self.assertEqual(str(error), "attendance ya existe")

    def test_uses_catalog_overrides_for_special_messages(self) -> None:
        self.assertEqual(
            str(domain_error("session.status", "format")),
            "session.status debe ser open, closing o closed",
        )
        self.assertEqual(
            str(domain_error("attendance.check_in_method", "format")),
            "attendance.check_in_method debe ser button, qr o null",
        )
        self.assertEqual(
            str(domain_error("session.closed_at", "required")),
            "session.closed_at es obligatorio si el estado es closed",
        )

    def test_keeps_the_sqlite_cause_on_an_unmapped_error(self) -> None:
        open_memory_db()
        with self.assertRaises(PersistenceError) as caught:
            query("SELECT * FROM no_such_table")
        error = caught.exception
        self.assertEqual(error.id, "sqlite.unmapped")
        self.assertEqual(error.kind, "PERSISTENCE")
        self.assertEqual(error.entity, "sqlite")
        self.assertEqual(str(error), "error de SQLite")
        self.assertIn("no such table", str(error.__cause__))

    def test_throws_with_fail(self) -> None:
        with self.assertRaisesRegex(NotFoundError, "session no existe") as caught:
            fail("session", "missing")
        error = caught.exception
        self.assertEqual(error.id, "session.missing")
        self.assertEqual(error.kind, "NOT_FOUND")

    def test_identifies_a_validation_from_the_attendance_model(self) -> None:
        with self.assertRaises(ValidationError) as caught:
            validate_model(Attendance, {**valid_attendance, "status": "late"})
        error = caught.exception
        self.assertEqual(error.id, "attendance.status.format")
        self.assertEqual(error.kind, "VALIDATION")
        self.assertEqual(error.entity, "attendance")
        self.assertEqual(error.field, "status")

    def test_maps_a_unique_violation_to_the_same_id_as_the_find(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        query(
            """INSERT INTO attendance (
              session_id, student_id, status, check_in_method, checked_in_at
            ) VALUES (
              :session_id, :student_id, 'absent', NULL, NULL
            )""",
            {"session_id": session.id, "student_id": OTHER_ID},
        )
        with self.assertRaises(ConflictError) as caught:
            query(
                """INSERT INTO attendance (
                  session_id, student_id, status, check_in_method, checked_in_at
                ) VALUES (
                  :session_id, :student_id, 'absent', NULL, NULL
                )""",
                {"session_id": session.id, "student_id": OTHER_ID},
            )
        error = caught.exception
        self.assertEqual(error.id, "attendance.taken")
        self.assertEqual(error.kind, "CONFLICT")

    def test_production_source_raises_with_fail(self) -> None:
        offenders: list[str] = []
        allowed = {"shared/errors.py", "sqlite/map_error.py"}
        for path in SRC.rglob("*.py"):
            relative = path.relative_to(SRC).as_posix()
            if relative in allowed:
                continue
            text = path.read_text(encoding="utf-8")
            if "raise ValidationError" in text or "raise NotFoundError" in text:
                offenders.append(relative)
            elif "raise ConflictError" in text or "raise ConfigurationError" in text:
                offenders.append(relative)
            elif "raise PersistenceError" in text:
                offenders.append(relative)
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
