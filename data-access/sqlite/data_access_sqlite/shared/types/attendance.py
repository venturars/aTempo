from typing import Annotated, Literal, Self, get_args

from pydantic import ConfigDict, model_validator

from data_access_sqlite.shared.errors import fail
from data_access_sqlite.shared.types.contract import Contract
from data_access_sqlite.shared.validation.fields import (
    NullableInstant,
    Uuid,
    nullable_one_of,
    one_of,
)

PresentStatus = Literal["present", "present_late"]
AbsentStatus = Literal["absent", "notified_absence"]
AttendanceStatus = Literal[PresentStatus, AbsentStatus]
CheckInMethod = Literal["button", "qr"]


class Attendance(Contract):
    """La asistencia de un alumno a una sesión.

    `present` y `present_late` llevan `check_in_method` y `checked_in_at`;
    `absent` y `notified_absence` van sin fichaje.
    """

    model_config = ConfigDict(title="attendance")

    session_id: Uuid
    student_id: Uuid
    status: Annotated[AttendanceStatus, one_of(get_args(AttendanceStatus))]
    check_in_method: Annotated[
        CheckInMethod | None,
        nullable_one_of(get_args(CheckInMethod)),
    ] = None
    checked_in_at: NullableInstant = None

    @model_validator(mode="after")
    def check_check_in_matches_status(self) -> Self:
        if self.status in get_args(PresentStatus):
            if self.check_in_method is None:
                fail("attendance.check_in_method", "required")
            if self.checked_in_at is None:
                fail("attendance.checked_in_at", "required")
        else:
            if self.check_in_method is not None:
                fail("attendance.check_in_method", "forbidden")
            if self.checked_in_at is not None:
                fail("attendance.checked_in_at", "forbidden")
        return self
