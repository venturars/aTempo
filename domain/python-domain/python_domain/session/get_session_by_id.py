from python_domain.session.columns import SESSION_COLUMNS
from python_domain.sqlite.db import QueryFn, query
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session

SELECT = f"SELECT {SESSION_COLUMNS} FROM session WHERE id = :id"


def get_session_by_id(
    session_id: str,
    run: QueryFn = query,
) -> Session | None:
    session_id = assert_uuid(session_id, "session.id")
    result = run(SELECT, {"id": session_id})
    if not result.rows:
        return None
    return assert_session(result.rows[0])
