from python_domain.session.columns import SESSION_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.session import Session, assert_session

UPDATE = f"""UPDATE session
SET
  course_id = :course_id,
  professor_id = :professor_id,
  start_at = :start_at,
  end_at = :end_at,
  status = :status,
  closed_at = :closed_at,
  late_after_minutes = :late_after_minutes,
  expected_count = :expected_count
WHERE id = :id"""

SELECT = f"SELECT {SESSION_COLUMNS} FROM session WHERE id = :id"


def update_session(value: object) -> Session | None:
    session = assert_session(value)
    query(UPDATE, dict(session))
    result = query(SELECT, {"id": session["id"]})
    if not result.rows:
        return None
    return assert_session(result.rows[0])
