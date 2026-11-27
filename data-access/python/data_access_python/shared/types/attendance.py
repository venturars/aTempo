from typing import Literal, TypedDict

AttendanceStatus = Literal[
    "present",
    "present_late",
    "absent",
    "notified_absence",
]
CheckInMethod = Literal["button", "qr"]


class Attendance(TypedDict):
    session_id: str
    student_id: str
    status: AttendanceStatus
    check_in_method: CheckInMethod | None
    checked_in_at: str | None
