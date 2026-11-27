from typing import TypedDict

from data_access_python.shared.errors import fail
from data_access_python.sqlite.pool import SqliteQuery
from data_access_python.sqlite.executors.session import find_session_by_id
from data_access_python.shared.types.session import Session
from data_access_python.shared.validation.assert_values import read_input_field


class FindSessionExistsInput(TypedDict):
    id: str


def find_session_exists(
    input: FindSessionExistsInput,
    run: SqliteQuery,
) -> Session:
    session = find_session_by_id(read_input_field(input, "id", "session.id"), run)
    if session is None:
        fail("session", "missing")
    return session
