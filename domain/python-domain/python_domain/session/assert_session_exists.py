from python_domain.session.get_session_by_id import get_session_by_id
from python_domain.sqlite.db import QueryFn, query
from python_domain.types.session import Session


def assert_session_exists(
    session_id: str,
    run: QueryFn = query,
) -> Session:
    session = get_session_by_id(session_id, run)
    if session is None:
        raise ValueError("session no existe")
    return session
