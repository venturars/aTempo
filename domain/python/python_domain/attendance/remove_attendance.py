from typing import TypedDict

from python_domain.sqlite.executors.attendance import remove_attendance as remove_attendance_row
from python_domain.types.assert_values import read_input_uuid


class RemoveAttendanceInput(TypedDict):
    session_id: str
    student_id: str


class RemoveAttendanceOutput(TypedDict):
    deleted: bool


def remove_attendance(input: RemoveAttendanceInput) -> RemoveAttendanceOutput:
    session_id = read_input_uuid(input, "session_id", "attendance.session_id")
    student_id = read_input_uuid(input, "student_id", "attendance.student_id")
    return {
        "deleted": remove_attendance_row(session_id, student_id),
    }
