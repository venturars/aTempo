from typing import TypedDict

from python_domain.sqlite.pool import SqliteQuery, with_transaction
from python_domain.sqlite.executors.session import (
    remove_session_attendances,
    remove_session_by_id,
)
from python_domain.types.assert_values import assert_uuid


class RemoveSessionInput(TypedDict):
    id: str


class RemoveSessionOutput(TypedDict):
    deleted: bool


def remove_session(input: RemoveSessionInput) -> RemoveSessionOutput:
    session_id = assert_uuid(input["id"], "session.id")

    def run(tx: SqliteQuery) -> bool:
        remove_session_attendances(session_id, tx)
        return remove_session_by_id(session_id, tx)

    return {"deleted": with_transaction(run)}
