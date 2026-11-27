from typing import TypedDict

from data_access_sqlite.shared.validation.assert_values import read_input_uuid
from data_access_sqlite.sqlite.executors.session import (
    remove_session_attendances,
    remove_session_by_id,
)
from data_access_sqlite.sqlite.pool import SqliteQuery, with_transaction


class RemoveSessionInput(TypedDict):
    id: str


class RemoveSessionOutput(TypedDict):
    deleted: bool


def remove_session(input: RemoveSessionInput) -> RemoveSessionOutput:
    session_id = read_input_uuid(input, "id", "session.id")

    def run(tx: SqliteQuery) -> bool:
        remove_session_attendances(session_id, tx)
        return remove_session_by_id(session_id, tx)

    return {"deleted": with_transaction(run)}
