import ast
import unittest
from pathlib import Path

import data_access_python
from data_access_python.shared.types.attendance import AttendanceStatus
from data_access_python.shared.validation.attendance import (
    ABSENT_STATUSES,
    ATTENDANCE_STATUSES,
    PRESENT_STATUSES,
)

PACKAGE = Path(__file__).resolve().parents[1] / "data_access_python"
SHARED_TYPES = PACKAGE / "shared" / "types"

EXPECTED_PUBLIC_NAMES = [
    "AddAttendanceInput",
    "AddAttendanceOutput",
    "AddSessionInput",
    "AddSessionOutput",
    "Attendance",
    "ConfigurationError",
    "ConflictError",
    "DomainError",
    "DomainErrorId",
    "DomainErrorKind",
    "NotFoundError",
    "PersistenceError",
    "RemoveAttendanceInput",
    "RemoveAttendanceOutput",
    "RemoveSessionInput",
    "RemoveSessionOutput",
    "RetrieveAllAttendancesBySessionInput",
    "RetrieveAllAttendancesBySessionOutput",
    "RetrieveAllAttendancesOutput",
    "RetrieveAllSessionsByCourseInput",
    "RetrieveAllSessionsByCourseOutput",
    "RetrieveAllSessionsByProfessorInput",
    "RetrieveAllSessionsByProfessorOutput",
    "RetrieveAllSessionsOutput",
    "RetrieveSessionByIdInput",
    "RetrieveSessionByIdOutput",
    "Session",
    "SessionCreate",
    "SessionUpdate",
    "UpdateAttendanceInput",
    "UpdateAttendanceOutput",
    "UpdateSessionInput",
    "UpdateSessionOutput",
    "ValidationError",
    "add_attendance",
    "add_session",
    "assert_attendance",
    "assert_session",
    "assert_session_create",
    "assert_session_update",
    "attendance_from_row",
    "check",
    "close_pool",
    "remove_attendance",
    "remove_session",
    "reset_pool",
    "retrieve_all_attendances",
    "retrieve_all_attendances_by_session",
    "retrieve_all_sessions",
    "retrieve_all_sessions_by_course",
    "retrieve_all_sessions_by_professor",
    "retrieve_session_by_id",
    "session_from_row",
    "update_attendance",
    "update_session",
]


def _is_type_alias(node: ast.Assign) -> bool:
    """`X = Literal[...]` o `X = OtroTipo`: un alias de tipo, no un valor."""
    value = node.value
    if isinstance(value, ast.Subscript):
        return isinstance(value.value, ast.Name) and value.value.id == "Literal"
    return isinstance(value, ast.Name) and value.id[0].isupper()


def _non_type_definitions(path: Path) -> list[str]:
    """Lo que un fichero de shared/types define y no es un tipo."""
    found: list[str] = []
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            found.append(f"función {node.name}")
        elif isinstance(node, ast.ClassDef):
            bases = {base.id for base in node.bases if isinstance(base, ast.Name)}
            if "TypedDict" not in bases:
                found.append(f"clase {node.name}")
        elif isinstance(node, ast.Assign):
            names = [t.id for t in node.targets if isinstance(t, ast.Name)]
            if names != ["__all__"] and not _is_type_alias(node):
                found.append(f"valor {', '.join(names)}")
    return found


class StructureTests(unittest.TestCase):
    def test_shared_types_only_defines_types(self) -> None:
        for path in sorted(SHARED_TYPES.glob("*.py")):
            with self.subTest(path=path.name):
                self.assertEqual(_non_type_definitions(path), [])

    def test_public_api_keeps_the_same_names(self) -> None:
        self.assertEqual(sorted(data_access_python.__all__), EXPECTED_PUBLIC_NAMES)
        for name in EXPECTED_PUBLIC_NAMES:
            self.assertTrue(hasattr(data_access_python, name), name)

    def test_present_and_absent_statuses_cover_every_attendance_status(self) -> None:
        # ATTENDANCE_STATUSES sale de AttendanceStatus con get_args. Estas dos
        # listas están escritas a mano: juntas tienen que dar todos los estados
        # sin repetir ninguno.
        self.assertEqual(
            sorted(PRESENT_STATUSES + ABSENT_STATUSES),
            sorted(ATTENDANCE_STATUSES),
        )
        self.assertEqual(set(ATTENDANCE_STATUSES), set(AttendanceStatus.__args__))


if __name__ == "__main__":
    unittest.main()
