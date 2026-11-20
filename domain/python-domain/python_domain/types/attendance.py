from typing import Literal, TypedDict

from python_domain.types.assert_values import (
    assert_instant,
    assert_non_empty_string,
    assert_nullable_instant,
    assert_uuid,
    normalize_instant,
)

ATTENDANCE_STATUSES = (
    "present",
    "present_late",
    "absent",
    "notified_absence",
)
CHECK_IN_METHODS = ("button", "qr")
PRESENT_STATUSES = ("present", "present_late")
ABSENT_STATUSES = ("absent", "notified_absence")
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
    checked = assert_nullable_instant(
        value.get("checked_in_at"),
        "attendance.checked_in_at",
    )
    instant = (
        None
        if checked is None
        else normalize_instant(checked, "attendance.checked_in_at")
    )
    assert_attendance_matches_status(status, check_in_method, instant)

    return {
        "session_id": session_id,
        "student_id": student_id,
        "status": status,
        "check_in_method": check_in_method,
        "checked_in_at": instant,
    }


def assert_attendance_matches_status(
    status: AttendanceStatus,
    check_in_method: CheckInMethod | None,
    checked_in_at: str | None,
) -> None:
    if status in PRESENT_STATUSES:
        if check_in_method is None:
            raise ValueError(
                "attendance.check_in_method es obligatorio si el estado es present o present_late"
            )
        if checked_in_at is None:
            raise ValueError(
                "attendance.checked_in_at es obligatorio si el estado es present o present_late"
            )
        return
    if status in ABSENT_STATUSES:
        if check_in_method is not None:
            raise ValueError(
                "attendance.check_in_method solo puede ir con present o present_late"
            )
        if checked_in_at is not None:
            raise ValueError(
                "attendance.checked_in_at solo puede ir con present o present_late"
            )


def assert_checked_in_at_in_session(
    checked_in_at: str | None,
    start_at: str,
    end_at: str,
) -> None:
    if checked_in_at is None:
        return
    instant = assert_instant(checked_in_at, "attendance.checked_in_at")
    start = assert_instant(start_at, "session.start_at")
    end = assert_instant(end_at, "session.end_at")
    if instant < start or instant > end:
        raise ValueError("attendance.checked_in_at debe estar dentro de la sesión")
