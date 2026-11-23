from typing import TypedDict

from python_domain.attendance.assert_attendance_available import (
    assert_attendance_available,
)
from python_domain.errors import PersistenceError
from python_domain.session.assert_session_exists import assert_session_exists
from python_domain.sqlite.pool import SqliteQuery, with_transaction
from python_domain.sqlite.executors.attendance import insert_attendance
from python_domain.types.attendance import (
    Attendance,
    assert_attendance,
    assert_checked_in_at_in_session,
)


class AddAttendanceInput(TypedDict):
    attendance: Attendance


class AddAttendanceOutput(TypedDict):
    attendance: Attendance


def add_attendance(input: AddAttendanceInput) -> AddAttendanceOutput:
    body = assert_attendance(input["attendance"])

    def run(tx: SqliteQuery) -> Attendance:
        session = assert_session_exists({"id": body["session_id"]}, tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        assert_attendance_available(
            {"session_id": body["session_id"], "student_id": body["student_id"]},
            tx,
        )
        row = insert_attendance(body, tx)
        if row is None:
            raise PersistenceError("attendance no se ha creado", entity="attendance")
        return assert_attendance(row)

    return {"attendance": with_transaction(run)}
