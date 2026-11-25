from typing import TypedDict

from python_domain.sqlite.executors.session import retrieve_all_sessions as retrieve_all_session_rows
from python_domain.types.session import Session, assert_session


class RetrieveAllSessionsOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions() -> RetrieveAllSessionsOutput:
    rows = retrieve_all_session_rows()
    return {"sessions": [assert_session(row) for row in rows]}
