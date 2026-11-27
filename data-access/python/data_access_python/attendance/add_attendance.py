from typing import TypedDict

from data_access_python.attendance.find_attendance_available import (
    find_attendance_available,
)
from data_access_python.shared.errors import fail
from data_access_python.session.find_session_exists import find_session_exists
from data_access_python.sqlite.pool import SqliteQuery, with_transaction
from data_access_python.sqlite.executors.attendance import (
    add_attendance as add_attendance_row,
)
from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.validation.attendance import (
    assert_attendance,
    assert_checked_in_at_in_session,
)
from data_access_python.sqlite.rows.attendance import attendance_from_row
from data_access_python.shared.validation.assert_values import read_input_field


class AddAttendanceInput(TypedDict):
    attendance: Attendance


class AddAttendanceOutput(TypedDict):
    attendance: Attendance


def add_attendance(input: AddAttendanceInput) -> AddAttendanceOutput:
    body = assert_attendance(read_input_field(input, "attendance", "attendance"))

    def run(tx: SqliteQuery) -> Attendance:
        session = find_session_exists({"id": body["session_id"]}, tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        find_attendance_available(
            {"session_id": body["session_id"], "student_id": body["student_id"]},
            tx,
        )
        row = add_attendance_row(body, tx)
        if row is None:
            fail("attendance", "not_created")
        return attendance_from_row(row)

    return {"attendance": with_transaction(run)}
