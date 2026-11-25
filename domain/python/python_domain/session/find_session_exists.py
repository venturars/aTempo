from typing import TypedDict

from python_domain.errors import NotFoundError
from python_domain.sqlite.pool import SqliteQuery
from python_domain.sqlite.executors.session import find_session_by_id
from python_domain.types.session import Session
from python_domain.types.assert_values import read_input_field


class FindSessionExistsInput(TypedDict):
    id: str


def find_session_exists(
    input: FindSessionExistsInput,
    run: SqliteQuery,
) -> Session:
    session = find_session_by_id(read_input_field(input, "id", "session.id"), run)
    if session is None:
        raise NotFoundError("session no existe", entity="session")
    return session
