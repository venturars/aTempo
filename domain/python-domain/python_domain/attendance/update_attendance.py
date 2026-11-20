from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.session.assert_session_exists import assert_session_exists
from python_domain.sqlite.db import QueryFn, with_transaction
from python_domain.types.attendance import (
    Attendance,
    assert_attendance,
    assert_checked_in_at_in_session,
)

UPDATE = f"""UPDATE attendance
SET
  status = :status,
  check_in_method = :check_in_method,
  checked_in_at = :checked_in_at
WHERE session_id = :session_id AND student_id = :student_id
RETURNING {ATTENDANCE_COLUMNS}"""


def update_attendance(value: object) -> Attendance | None:
    body = assert_attendance(value)

    def run(tx: QueryFn) -> Attendance | None:
        session = assert_session_exists(body["session_id"], tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        result = tx(UPDATE, dict(body))
        if not result.rows:
            return None
        return assert_attendance(result.rows[0])

    return with_transaction(run)
