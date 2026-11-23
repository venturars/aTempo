from typing import TypedDict

from python_domain.sqlite.executors.attendance import list_attendances_by_session_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.attendance import Attendance, assert_attendance


class ListAttendancesBySessionInput(TypedDict):
    session_id: str


class ListAttendancesBySessionOutput(TypedDict):
    attendances: list[Attendance]


def list_attendances_by_session(
    input: ListAttendancesBySessionInput,
) -> ListAttendancesBySessionOutput:
    session_id = assert_uuid(input["session_id"], "attendance.session_id")
    rows = list_attendances_by_session_id(session_id)
    return {"attendances": [assert_attendance(row) for row in rows]}
