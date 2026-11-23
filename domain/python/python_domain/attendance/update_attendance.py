from typing import TypedDict

from python_domain.session.assert_session_exists import assert_session_exists
from python_domain.sqlite.pool import SqliteQuery, with_transaction
from python_domain.sqlite.repositories.attendance import update_attendance_row
from python_domain.types.attendance import (
    Attendance,
    assert_attendance,
    assert_checked_in_at_in_session,
)


class UpdateAttendanceInput(TypedDict):
    attendance: Attendance


class UpdateAttendanceOutput(TypedDict):
    attendance: Attendance | None


def update_attendance(input: UpdateAttendanceInput) -> UpdateAttendanceOutput:
    body = assert_attendance(input["attendance"])

    def run(tx: SqliteQuery) -> Attendance | None:
        session = assert_session_exists({"id": body["session_id"]}, tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        row = update_attendance_row(body, tx)
        if row is None:
            return None
        return assert_attendance(row)

    return {"attendance": with_transaction(run)}
