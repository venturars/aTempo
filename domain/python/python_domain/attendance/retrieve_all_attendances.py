from typing import TypedDict

from python_domain.sqlite.executors.attendance import (
    retrieve_all_attendances as retrieve_all_attendance_rows,
)
from python_domain.types.attendance import Attendance, assert_attendance


class RetrieveAllAttendancesOutput(TypedDict):
    attendances: list[Attendance]


def retrieve_all_attendances() -> RetrieveAllAttendancesOutput:
    rows = retrieve_all_attendance_rows()
    return {"attendances": [assert_attendance(row) for row in rows]}
