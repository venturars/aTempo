from typing import TypedDict

from data_access_sqlite.shared.types.session import Session
from data_access_sqlite.sqlite.executors.session import (
    retrieve_all_sessions as retrieve_all_session_rows,
)
from data_access_sqlite.sqlite.rows.session import session_from_row


class RetrieveAllSessionsOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions() -> RetrieveAllSessionsOutput:
    rows = retrieve_all_session_rows()
    return {"sessions": [session_from_row(row) for row in rows]}
