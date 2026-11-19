from python_domain.session.columns import SESSION_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session

SELECT = f"SELECT {SESSION_COLUMNS} FROM session WHERE course_id = :course_id"


def list_sessions_by_course(course_id: str) -> list[Session]:
    assert_uuid(course_id, "session.course_id")
    result = query(SELECT, {"course_id": course_id})
    return [assert_session(row) for row in result.rows]
