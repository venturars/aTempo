from python_domain.sqlite.db import QueryFn, with_transaction
from python_domain.types.assert_values import assert_uuid

DELETE_ATTENDANCES = "DELETE FROM attendance WHERE session_id = :id"
DELETE_SESSION = "DELETE FROM session WHERE id = :id"


def delete_session(session_id: str) -> bool:
    assert_uuid(session_id, "session.id")

    def run(query: QueryFn) -> bool:
        query(DELETE_ATTENDANCES, {"id": session_id})
        result = query(DELETE_SESSION, {"id": session_id})
        return result.rowcount > 0

    return bool(with_transaction(run))
