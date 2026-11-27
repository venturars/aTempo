from data_access_python.sqlite.columns import SESSION_COLUMNS

LIST_SESSIONS = f"SELECT {SESSION_COLUMNS} FROM session"

GET_SESSION_BY_ID = f"SELECT {SESSION_COLUMNS} FROM session WHERE id = :id"

LIST_SESSIONS_BY_COURSE = f"""SELECT {SESSION_COLUMNS}
FROM session
WHERE course_id = :course_id"""

LIST_SESSIONS_BY_PROFESSOR = f"""SELECT {SESSION_COLUMNS}
FROM session
WHERE professor_id = :professor_id"""

INSERT_SESSION = f"""INSERT INTO session (
  id,
  course_id,
  professor_id,
  start_at,
  end_at,
  status,
  closed_at,
  late_after_minutes,
  expected_count
) VALUES (
  :id,
  :course_id,
  :professor_id,
  :start_at,
  :end_at,
  :status,
  :closed_at,
  :late_after_minutes,
  :expected_count
)
RETURNING {SESSION_COLUMNS}"""

UPDATE_SESSION = f"""UPDATE session
SET
  course_id = :course_id,
  professor_id = :professor_id,
  start_at = :start_at,
  end_at = :end_at,
  status = :status,
  closed_at = :closed_at,
  late_after_minutes = :late_after_minutes,
  expected_count = :expected_count
WHERE id = :id
RETURNING {SESSION_COLUMNS}"""

DELETE_SESSION_ATTENDANCES = "DELETE FROM attendance WHERE session_id = :id"

DELETE_SESSION = "DELETE FROM session WHERE id = :id"
