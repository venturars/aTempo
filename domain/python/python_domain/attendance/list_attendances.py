from typing import TypedDict

from python_domain.sqlite.executors.attendance import (
    list_attendances as list_attendance_rows,
)
from python_domain.types.attendance import Attendance, assert_attendance


class ListAttendancesOutput(TypedDict):
    attendances: list[Attendance]


def list_attendances() -> ListAttendancesOutput:
    rows = list_attendance_rows()
    return {"attendances": [assert_attendance(row) for row in rows]}
