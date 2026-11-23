from typing import TypedDict

from python_domain.sqlite.pool import SqliteQuery, with_transaction
from python_domain.sqlite.executors.attendance import list_attendances_by_session_id
from python_domain.sqlite.executors.session import update_session_row
from python_domain.types.attendance import assert_checked_in_at_in_session
from python_domain.types.session import Session, SessionUpdate, assert_session


class UpdateSessionInput(TypedDict):
    session: SessionUpdate


class UpdateSessionOutput(TypedDict):
    session: Session | None


def update_session(input: UpdateSessionInput) -> UpdateSessionOutput:
    session = assert_session(input["session"])

    def run(tx: SqliteQuery) -> Session | None:
        for attendance in list_attendances_by_session_id(session["id"], tx):
            assert_checked_in_at_in_session(
                attendance["checked_in_at"],
                session["start_at"],
                session["end_at"],
            )
        row = update_session_row(session, tx)
        if row is None:
            return None
        return assert_session(row)

    return {"session": with_transaction(run)}
