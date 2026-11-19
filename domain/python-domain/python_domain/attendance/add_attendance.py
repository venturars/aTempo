from python_domain.attendance.assert_attendance_available import (
    assert_attendance_available,
)
from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.session.assert_session_exists import assert_session_exists
from python_domain.sqlite.db import query
from python_domain.types.attendance import Attendance, assert_attendance

INSERT = """INSERT INTO attendance (
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
)"""

SELECT = f"""SELECT {ATTENDANCE_COLUMNS}
FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""


def add_attendance(value: object) -> Attendance:
    body = assert_attendance(value)
    assert_session_exists(body["session_id"])
    assert_attendance_available(body["session_id"], body["student_id"])
    query(INSERT, dict(body))
    result = query(SELECT, {
        "session_id": body["session_id"],
        "student_id": body["student_id"],
    })
    if not result.rows:
        raise RuntimeError("attendance no se ha creado")
    return assert_attendance(result.rows[0])
