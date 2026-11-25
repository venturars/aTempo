from typing import TypedDict

from python_domain.errors import ConflictError
from python_domain.sqlite.pool import SqliteQuery
from python_domain.sqlite.executors.attendance import attendance_exists


class FindAttendanceAvailableInput(TypedDict):
    session_id: str
    student_id: str


def find_attendance_available(
    input: FindAttendanceAvailableInput,
    run: SqliteQuery,
) -> None:
    if attendance_exists(input["session_id"], input["student_id"], run):
        raise ConflictError("attendance ya existe", entity="attendance")
