from typing import TypedDict

from data_access_python.shared.types.session import Session
from data_access_python.shared.validation.assert_values import read_input_uuid
from data_access_python.sqlite.executors.session import (
    retrieve_all_sessions_by_professor_id,
)
from data_access_python.sqlite.rows.session import session_from_row


class RetrieveAllSessionsByProfessorInput(TypedDict):
    professor_id: str


class RetrieveAllSessionsByProfessorOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions_by_professor(
    input: RetrieveAllSessionsByProfessorInput,
) -> RetrieveAllSessionsByProfessorOutput:
    professor_id = read_input_uuid(input, "professor_id", "session.professor_id")
    rows = retrieve_all_sessions_by_professor_id(professor_id)
    return {"sessions": [session_from_row(row) for row in rows]}
