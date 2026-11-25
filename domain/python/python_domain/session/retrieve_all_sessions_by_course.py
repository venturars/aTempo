from typing import TypedDict

from python_domain.sqlite.executors.session import retrieve_all_sessions_by_course_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session


class RetrieveAllSessionsByCourseInput(TypedDict):
    course_id: str


class RetrieveAllSessionsByCourseOutput(TypedDict):
    sessions: list[Session]


def retrieve_all_sessions_by_course(
    input: RetrieveAllSessionsByCourseInput,
) -> RetrieveAllSessionsByCourseOutput:
    course_id = assert_uuid(input["course_id"], "session.course_id")
    rows = retrieve_all_sessions_by_course_id(course_id)
    return {"sessions": [assert_session(row) for row in rows]}
