from uuid import uuid4

from python_domain.session.columns import SESSION_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.session import Session, assert_session, assert_session_input

INSERT = f"""INSERT INTO session (
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
)"""

SELECT = f"SELECT {SESSION_COLUMNS} FROM session WHERE id = :id"


def create_session(value: object) -> Session:
    body = assert_session_input(value)
    session_id = str(uuid4())
    query(INSERT, {"id": session_id, **body})
    result = query(SELECT, {"id": session_id})
    if not result.rows:
        raise RuntimeError("session no se ha creado")
    return assert_session(result.rows[0])
