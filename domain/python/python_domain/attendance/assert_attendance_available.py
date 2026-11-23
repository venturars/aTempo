from typing import TypedDict

from python_domain.errors import ConflictError
from python_domain.sqlite.pool import SqliteQuery
from python_domain.sqlite.repositories.attendance import attendance_exists


class AssertAttendanceAvailableInput(TypedDict):
    session_id: str
    student_id: str


def assert_attendance_available(
    input: AssertAttendanceAvailableInput,
    run: SqliteQuery,
) -> None:
    if attendance_exists(input["session_id"], input["student_id"], run):
        raise ConflictError("attendance ya existe", entity="attendance")
