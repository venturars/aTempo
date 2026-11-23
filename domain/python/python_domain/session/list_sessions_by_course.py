from typing import TypedDict

from python_domain.sqlite.repositories.session import list_sessions_by_course_id
from python_domain.types.assert_values import assert_uuid
from python_domain.types.session import Session, assert_session


class ListSessionsByCourseInput(TypedDict):
    course_id: str


class ListSessionsByCourseOutput(TypedDict):
    sessions: list[Session]


def list_sessions_by_course(
    input: ListSessionsByCourseInput,
) -> ListSessionsByCourseOutput:
    course_id = assert_uuid(input["course_id"], "session.course_id")
    rows = list_sessions_by_course_id(course_id)
    return {"sessions": [assert_session(row) for row in rows]}
