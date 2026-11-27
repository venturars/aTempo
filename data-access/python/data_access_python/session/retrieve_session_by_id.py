from typing import TypedDict

from data_access_python.sqlite.executors.session import find_session_by_id
from data_access_python.shared.validation.assert_values import read_input_uuid
from data_access_python.shared.types.session import Session
from data_access_python.sqlite.rows.session import session_from_row


class RetrieveSessionByIdInput(TypedDict):
    id: str


class RetrieveSessionByIdOutput(TypedDict):
    session: Session | None


def retrieve_session_by_id(input: RetrieveSessionByIdInput) -> RetrieveSessionByIdOutput:
    session_id = read_input_uuid(input, "id", "session.id")
    row = find_session_by_id(session_id)
    if row is None:
        return {"session": None}
    return {"session": session_from_row(row)}
