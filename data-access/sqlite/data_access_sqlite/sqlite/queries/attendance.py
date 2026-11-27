from data_access_sqlite.sqlite.columns import ATTENDANCE_COLUMNS

LIST_ATTENDANCES = f"SELECT {ATTENDANCE_COLUMNS} FROM attendance"

LIST_ATTENDANCES_BY_SESSION = f"""SELECT {ATTENDANCE_COLUMNS}
FROM attendance
WHERE session_id = :session_id"""

FIND_ATTENDANCE = """SELECT 1
FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""

INSERT_ATTENDANCE = f"""INSERT INTO attendance (
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

UPDATE_ATTENDANCE = f"""UPDATE attendance
SET
  status = :status,
  check_in_method = :check_in_method,
  checked_in_at = :checked_in_at
WHERE session_id = :session_id AND student_id = :student_id
RETURNING {ATTENDANCE_COLUMNS}"""

DELETE_ATTENDANCE = """DELETE FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""
