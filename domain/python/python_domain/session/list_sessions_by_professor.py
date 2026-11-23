from typing import TypedDict

from python_domain.sqlite.repositories.session import list_sessions_by_professor_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session


class ListSessionsByProfessorInput(TypedDict):
    professor_id: str


class ListSessionsByProfessorOutput(TypedDict):
    sessions: list[Session]


def list_sessions_by_professor(
    input: ListSessionsByProfessorInput,
) -> ListSessionsByProfessorOutput:
    professor_id = assert_uuid(input["professor_id"], "session.professor_id")
    rows = list_sessions_by_professor_id(professor_id)
    return {"sessions": [assert_session(row) for row in rows]}
