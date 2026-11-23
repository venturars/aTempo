from typing import TypedDict

from python_domain.sqlite.repositories.session import list_sessions as list_session_rows
from python_domain.types.session import Session, assert_session


class ListSessionsOutput(TypedDict):
    sessions: list[Session]


def list_sessions() -> ListSessionsOutput:
    rows = list_session_rows()
    return {"sessions": [assert_session(row) for row in rows]}
