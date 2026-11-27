from typing import TypedDict

from data_access_sqlite.attendance.find_attendance_available import (
    find_attendance_available,
)
from data_access_sqlite.session.find_session_exists import find_session_exists
from data_access_sqlite.shared.errors import fail
from data_access_sqlite.shared.types.attendance import Attendance
from data_access_sqlite.shared.validation.assert_values import read_input_field
from data_access_sqlite.shared.validation.attendance import (
    assert_checked_in_at_in_session,
)
from data_access_sqlite.shared.validation.model import validate_model
from data_access_sqlite.sqlite.executors.attendance import (
    add_attendance as add_attendance_row,
)
from data_access_sqlite.sqlite.pool import SqliteQuery, with_transaction
from data_access_sqlite.sqlite.rows.attendance import attendance_from_row


class AddAttendanceInput(TypedDict):
    attendance: Attendance


class AddAttendanceOutput(TypedDict):
    attendance: Attendance


def add_attendance(input: AddAttendanceInput) -> AddAttendanceOutput:
    body = validate_model(
        Attendance,
        read_input_field(input, "attendance", "attendance"),
    )

    def run(tx: SqliteQuery) -> Attendance:
        session = find_session_exists({"id": body.session_id}, tx)
        assert_checked_in_at_in_session(
            body.checked_in_at,
            session["start_at"],
            session["end_at"],
        )
        find_attendance_available(
            {"session_id": body.session_id, "student_id": body.student_id},
            tx,
        )
        row = add_attendance_row(body.model_dump(), tx)
        if row is None:
            fail("attendance", "not_created")
        return attendance_from_row(row)

    return {"attendance": with_transaction(run)}
