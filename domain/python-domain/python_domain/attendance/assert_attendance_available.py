from python_domain.sqlite.db import query

SELECT = """SELECT 1
FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""


def assert_attendance_available(session_id: str, student_id: str) -> None:
    result = query(SELECT, {"session_id": session_id, "student_id": student_id})
    if result.rows:
        raise ValueError("attendance ya existe")
