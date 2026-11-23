from typing import TypedDict

from python_domain.sqlite.executors.session import find_session_by_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session


class GetSessionByIdInput(TypedDict):
    id: str


class GetSessionByIdOutput(TypedDict):
    session: Session | None


def get_session_by_id(input: GetSessionByIdInput) -> GetSessionByIdOutput:
    session_id = assert_uuid(input["id"], "session.id")
    row = find_session_by_id(session_id)
    if row is None:
        return {"session": None}
    return {"session": assert_session(row)}
