from typing import TypedDict

from data_access_python.session.find_session_exists import find_session_exists
from data_access_python.sqlite.pool import SqliteQuery, with_transaction
from data_access_python.sqlite.executors.attendance import update_attendance_row
from data_access_python.shared.types.attendance import Attendance
from data_access_python.shared.validation.attendance import (
    assert_attendance,
    assert_checked_in_at_in_session,
)
from data_access_python.sqlite.rows.attendance import attendance_from_row
from data_access_python.shared.validation.assert_values import read_input_field


class UpdateAttendanceInput(TypedDict):
    attendance: Attendance


class UpdateAttendanceOutput(TypedDict):
    attendance: Attendance | None


def update_attendance(input: UpdateAttendanceInput) -> UpdateAttendanceOutput:
    body = assert_attendance(read_input_field(input, "attendance", "attendance"))

    def run(tx: SqliteQuery) -> Attendance | None:
        session = find_session_exists({"id": body["session_id"]}, tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        row = update_attendance_row(body, tx)
        if row is None:
            return None
        return attendance_from_row(row)

    return {"attendance": with_transaction(run)}
