from python_domain.session.columns import SESSION_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.session import Session, assert_session

SELECT = f"SELECT {SESSION_COLUMNS} FROM session"


def list_sessions() -> list[Session]:
    result = query(SELECT)
    return [assert_session(row) for row in result.rows]
