from typing import TypedDict

from python_domain.sqlite.pool import SqliteQuery, with_transaction
from python_domain.sqlite.executors.session import (
    delete_session_attendances,
    delete_session_by_id,
)
from python_domain.types.assert_values import assert_uuid


class DeleteSessionInput(TypedDict):
    id: str


class DeleteSessionOutput(TypedDict):
    deleted: bool


def delete_session(input: DeleteSessionInput) -> DeleteSessionOutput:
    session_id = assert_uuid(input["id"], "session.id")

    def run(tx: SqliteQuery) -> bool:
        delete_session_attendances(session_id, tx)
        return delete_session_by_id(session_id, tx)

    return {"deleted": with_transaction(run)}
