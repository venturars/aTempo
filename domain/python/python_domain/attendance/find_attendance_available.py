from typing import TypedDict

from python_domain.errors import ConflictError
from python_domain.sqlite.pool import SqliteQuery
from python_domain.sqlite.executors.attendance import attendance_exists
from python_domain.types.assert_values import read_input_field


class FindAttendanceAvailableInput(TypedDict):
    session_id: str
    student_id: str


def find_attendance_available(
    input: FindAttendanceAvailableInput,
    run: SqliteQuery,
) -> None:
    session_id = read_input_field(input, "session_id", "attendance.session_id")
    student_id = read_input_field(input, "student_id", "attendance.student_id")
    if attendance_exists(session_id, student_id, run):
        raise ConflictError("attendance ya existe", entity="attendance")
