from typing import TypedDict

from data_access_python.shared.errors import fail
from data_access_python.shared.validation.assert_values import read_input_field
from data_access_python.sqlite.executors.attendance import attendance_exists
from data_access_python.sqlite.pool import SqliteQuery


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
        fail("attendance", "taken")
