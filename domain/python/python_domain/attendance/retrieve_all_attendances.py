from typing import TypedDict

from python_domain.sqlite.executors.attendance import (
    retrieve_all_attendances as retrieve_all_attendance_rows,
)
from python_domain.types.attendance import Attendance, attendance_from_row


class RetrieveAllAttendancesOutput(TypedDict):
    attendances: list[Attendance]


def retrieve_all_attendances() -> RetrieveAllAttendancesOutput:
    rows = retrieve_all_attendance_rows()
    return {"attendances": [attendance_from_row(row) for row in rows]}
