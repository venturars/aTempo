from python_domain.attendance.assert_attendance_available import (
    assert_attendance_available,
)
from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.session.assert_session_exists import assert_session_exists
from python_domain.sqlite.db import QueryFn, with_transaction
from python_domain.types.attendance import (
    Attendance,
    assert_attendance,
    assert_checked_in_at_in_session,
)

INSERT = f"""INSERT INTO attendance (
  session_id,
  student_id,
  status,
  check_in_method,
  checked_in_at
) VALUES (
  :session_id,
  :student_id,
  :status,
  :check_in_method,
  :checked_in_at
)
RETURNING {ATTENDANCE_COLUMNS}"""


def add_attendance(value: object) -> Attendance:
    body = assert_attendance(value)

    def run(tx: QueryFn) -> Attendance:
        session = assert_session_exists(body["session_id"], tx)
        assert_checked_in_at_in_session(
            body["checked_in_at"],
            session["start_at"],
            session["end_at"],
        )
        assert_attendance_available(body["session_id"], body["student_id"], tx)
        result = tx(INSERT, dict(body))
        if not result.rows:
            raise RuntimeError("attendance no se ha creado")
        return assert_attendance(result.rows[0])

    return with_transaction(run)
