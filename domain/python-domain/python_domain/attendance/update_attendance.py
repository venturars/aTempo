from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.attendance import Attendance, assert_attendance

UPDATE = """UPDATE attendance
SET
  status = :status,
  check_in_method = :check_in_method,
  checked_in_at = :checked_in_at
WHERE session_id = :session_id AND student_id = :student_id"""

SELECT = f"""SELECT {ATTENDANCE_COLUMNS}
FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""


def update_attendance(value: object) -> Attendance | None:
    body = assert_attendance(value)
    query(UPDATE, dict(body))
    result = query(SELECT, {
        "session_id": body["session_id"],
        "student_id": body["student_id"],
    })
    if not result.rows:
        return None
    return assert_attendance(result.rows[0])
