import ast
import importlib
import unittest
from pathlib import Path

from pydantic import BaseModel

import data_access_python
from data_access_python.shared.types.contract import Contract

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
    "DomainErrorKind",
    "ErrorId",
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
    "validate_model",
]


def _is_type_alias(node: ast.Assign) -> bool:
    """`X = Literal[...]` o `X = OtroTipo`: un alias de tipo, no un valor."""
    value = node.value
    if isinstance(value, ast.Subscript):
        return isinstance(value.value, ast.Name) and value.value.id == "Literal"
    return isinstance(value, ast.Name) and value.id[0].isupper()


def _models_of(path: Path) -> list[type]:
    """Las clases que define un fichero de shared/types."""
    module = importlib.import_module(
        f"data_access_python.shared.types.{path.stem}",
    )
    names = [
        node.name
        for node in ast.parse(path.read_text(encoding="utf-8")).body
        if isinstance(node, ast.ClassDef)
    ]
    return [getattr(module, name) for name in names]


def _non_type_definitions(path: Path) -> list[str]:
    """Lo que un fichero de shared/types define y no es un modelo ni un tipo."""
    found: list[str] = []
    for model in _models_of(path):
        if not issubclass(model, BaseModel):
            found.append(f"clase {model.__name__}")
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            found.append(f"función {node.name}")
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

    def test_every_contract_is_strict_frozen_and_named(self) -> None:
        for path in sorted(SHARED_TYPES.glob("*.py")):
            for model in _models_of(path):
                if model is Contract:
                    continue
                with self.subTest(model=model.__name__):
                    self.assertTrue(issubclass(model, Contract))
                    self.assertTrue(model.model_config.get("strict"))
                    self.assertTrue(model.model_config.get("frozen"))
                    self.assertTrue(model.model_config.get("title"))

    def test_public_api_exports_these_names(self) -> None:
        self.assertEqual(sorted(data_access_python.__all__), EXPECTED_PUBLIC_NAMES)
        for name in EXPECTED_PUBLIC_NAMES:
            self.assertTrue(hasattr(data_access_python, name), name)


if __name__ == "__main__":
    unittest.main()
