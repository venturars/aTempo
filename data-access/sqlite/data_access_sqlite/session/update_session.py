from typing import TypedDict

from data_access_sqlite.shared.types.session import Session, SessionUpdate
from data_access_sqlite.shared.validation.assert_values import read_input_field
from data_access_sqlite.shared.validation.attendance import (
    assert_checked_in_at_in_session,
)
from data_access_sqlite.shared.validation.model import validate_model
from data_access_sqlite.sqlite.executors.attendance import (
    retrieve_all_attendances_by_session_id,
)
from data_access_sqlite.sqlite.executors.session import update_session_row
from data_access_sqlite.sqlite.pool import SqliteQuery, with_transaction
from data_access_sqlite.sqlite.rows.session import session_from_row


class UpdateSessionInput(TypedDict):
    session: SessionUpdate


class UpdateSessionOutput(TypedDict):
    session: Session | None


def update_session(input: UpdateSessionInput) -> UpdateSessionOutput:
    session = validate_model(
        Session,
        read_input_field(input, "session", "session"),
    )

    def run(tx: SqliteQuery) -> Session | None:
        for attendance in retrieve_all_attendances_by_session_id(session.id, tx):
            assert_checked_in_at_in_session(
                attendance["checked_in_at"],
                session.start_at,
                session.end_at,
            )
        row = update_session_row(session.model_dump(), tx)
        if row is None:
            return None
        return session_from_row(row)

    return {"session": with_transaction(run)}
