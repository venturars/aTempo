from python_domain.session.get_session_by_id import get_session_by_id


def assert_session_exists(session_id: str) -> None:
    session = get_session_by_id(session_id)
    if session is None:
        raise ValueError("session no existe")
