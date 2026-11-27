from typing import TypedDict

from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.validation.assert_values import read_input_uuid
from data_access_python.sqlite.executors.attendance import (
    retrieve_all_attendances_by_session_id,
)
from data_access_python.sqlite.rows.attendance import attendance_from_row


class RetrieveAllAttendancesBySessionInput(TypedDict):
    session_id: str


class RetrieveAllAttendancesBySessionOutput(TypedDict):
    attendances: list[Attendance]


def retrieve_all_attendances_by_session(
    input: RetrieveAllAttendancesBySessionInput,
) -> RetrieveAllAttendancesBySessionOutput:
    session_id = read_input_uuid(input, "session_id", "attendance.session_id")
    rows = retrieve_all_attendances_by_session_id(session_id)
    return {"attendances": [attendance_from_row(row) for row in rows]}
