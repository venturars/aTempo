from typing import TypedDict

from python_domain.sqlite.executors.session import find_session_by_id
from python_domain.types.assert_values import read_input_uuid
from python_domain.types.session import Session, assert_session


class RetrieveSessionByIdInput(TypedDict):
    id: str


class RetrieveSessionByIdOutput(TypedDict):
    session: Session | None


def retrieve_session_by_id(input: RetrieveSessionByIdInput) -> RetrieveSessionByIdOutput:
    session_id = read_input_uuid(input, "id", "session.id")
    row = find_session_by_id(session_id)
    if row is None:
        return {"session": None}
    return {"session": assert_session(row)}
