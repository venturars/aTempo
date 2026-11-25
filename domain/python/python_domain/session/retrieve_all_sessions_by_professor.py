from typing import TypedDict

from python_domain.sqlite.executors.session import retrieve_all_sessions_by_professor_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session


class RetrieveAllSessionsByProfessorInput(TypedDict):
    professor_id: str


class RetrieveAllSessionsByProfessorOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions_by_professor(
    input: RetrieveAllSessionsByProfessorInput,
) -> RetrieveAllSessionsByProfessorOutput:
    professor_id = assert_uuid(input["professor_id"], "session.professor_id")
    rows = retrieve_all_sessions_by_professor_id(professor_id)
    return {"sessions": [assert_session(row) for row in rows]}
