from python_domain.sqlite.db import query
from python_domain.types.assert_values import assert_uuid

DELETE = """DELETE FROM attendance
WHERE session_id = :session_id AND student_id = :student_id"""


def remove_attendance(session_id: str, student_id: str) -> bool:
    session_id = assert_uuid(session_id, "attendance.session_id")
    student_id = assert_uuid(student_id, "attendance.student_id")
    result = query(DELETE, {
        "session_id": session_id,
        "student_id": student_id,
    })
    return result.rowcount > 0
