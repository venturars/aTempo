from typing import TypedDict

from python_domain.sqlite.executors.attendance import retrieve_all_attendances_by_session_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.attendance import Attendance, assert_attendance


class RetrieveAllAttendancesBySessionInput(TypedDict):
    session_id: str


class RetrieveAllAttendancesBySessionOutput(TypedDict):
    attendances: list[Attendance]


def retrieve_all_attendances_by_session(
    input: RetrieveAllAttendancesBySessionInput,
) -> RetrieveAllAttendancesBySessionOutput:
    session_id = assert_uuid(input["session_id"], "attendance.session_id")
    rows = retrieve_all_attendances_by_session_id(session_id)
    return {"attendances": [assert_attendance(row) for row in rows]}
