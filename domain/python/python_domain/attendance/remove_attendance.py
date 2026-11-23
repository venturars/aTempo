from typing import TypedDict

from python_domain.sqlite.repositories.attendance import delete_attendance
from python_domain.types.assert_values import assert_uuid


class RemoveAttendanceInput(TypedDict):
    session_id: str
    student_id: str


class RemoveAttendanceOutput(TypedDict):
    deleted: bool


def remove_attendance(input: RemoveAttendanceInput) -> RemoveAttendanceOutput:
    session_id = assert_uuid(input["session_id"], "attendance.session_id")
    student_id = assert_uuid(input["student_id"], "attendance.student_id")
    return {
        "deleted": delete_attendance(session_id, student_id),
    }
