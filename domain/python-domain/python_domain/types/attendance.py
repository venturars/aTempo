from typing import Literal, TypedDict

from python_domain.types.assert_values import (
    assert_non_empty_string,
    assert_nullable_instant,
    assert_uuid,
)

ATTENDANCE_STATUSES = (
    "present",
    "present_late",
    "absent",
    "notified_absence",
)
CHECK_IN_METHODS = ("button", "qr")
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


def assert_attendance_status(value: object) -> AttendanceStatus:
    text = assert_non_empty_string(value, "attendance.status")
    if text not in ATTENDANCE_STATUSES:
        raise ValueError(
            "attendance.status debe ser present, present_late, absent o notified_absence"
        )
    return text  # type: ignore[return-value]


def assert_check_in_method(value: object) -> CheckInMethod | None:
    if value is None:
        return None
    text = assert_non_empty_string(value, "attendance.check_in_method")
    if text not in CHECK_IN_METHODS:
        raise ValueError("attendance.check_in_method debe ser button, qr o null")
    return text  # type: ignore[return-value]


def assert_attendance(value: object) -> Attendance:
    if value is None or not isinstance(value, dict):
        raise ValueError("attendance debe ser un objeto")

    session_id = assert_uuid(value.get("session_id"), "attendance.session_id")
    student_id = assert_uuid(value.get("student_id"), "attendance.student_id")
    status = assert_attendance_status(value.get("status"))
    check_in_method = assert_check_in_method(value.get("check_in_method"))
    checked_in_at = value.get("checked_in_at")
    if checked_in_at is None:
        instant = None
    else:
        assert_nullable_instant(checked_in_at, "attendance.checked_in_at")
        instant = str(checked_in_at)

    return {
        "session_id": session_id,
        "student_id": student_id,
        "status": status,
        "check_in_method": check_in_method,
        "checked_in_at": instant,
    }
