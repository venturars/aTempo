from typing import TypedDict
from uuid import uuid4

from data_access_sqlite.shared.errors import fail
from data_access_sqlite.shared.types.session import Session, SessionCreate
from data_access_sqlite.shared.validation.assert_values import read_input_field
from data_access_sqlite.shared.validation.model import validate_model
from data_access_sqlite.sqlite.executors.session import add_session as add_session_row
from data_access_sqlite.sqlite.rows.session import session_from_row


class AddSessionInput(TypedDict):
    session: SessionCreate


class AddSessionOutput(TypedDict):
    session: Session


def add_session(input: AddSessionInput) -> AddSessionOutput:
    body = validate_model(
        SessionCreate,
        read_input_field(input, "session", "session"),
    )
    row = add_session_row({"id": str(uuid4()), **body.model_dump()})
    if row is None:
        fail("session", "not_created")
    return {"session": session_from_row(row)}
