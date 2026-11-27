from typing import TypedDict

from data_access_sqlite.shared.types.session import Session
from data_access_sqlite.shared.validation.assert_values import read_input_uuid
from data_access_sqlite.sqlite.executors.session import (
    retrieve_all_sessions_by_course_id,
)
from data_access_sqlite.sqlite.rows.session import session_from_row


class RetrieveAllSessionsByCourseInput(TypedDict):
    course_id: str


class RetrieveAllSessionsByCourseOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions_by_course(
    input: RetrieveAllSessionsByCourseInput,
) -> RetrieveAllSessionsByCourseOutput:
    course_id = read_input_uuid(input, "course_id", "session.course_id")
    rows = retrieve_all_sessions_by_course_id(course_id)
    return {"sessions": [session_from_row(row) for row in rows]}
