from typing import TypedDict
from uuid import uuid4

from data_access_python.shared.errors import fail
from data_access_python.sqlite.executors.session import add_session as add_session_row
from data_access_python.shared.types.session import Session, SessionCreate
from data_access_python.shared.validation.session import assert_session_create
from data_access_python.sqlite.rows.session import session_from_row
from data_access_python.shared.validation.assert_values import read_input_field


class AddSessionInput(TypedDict):
    session: SessionCreate


class AddSessionOutput(TypedDict):
    session: Session


def add_session(input: AddSessionInput) -> AddSessionOutput:
    body = assert_session_create(read_input_field(input, "session", "session"))
    row = add_session_row({"id": str(uuid4()), **body})
    if row is None:
        fail("session", "not_created")
    return {"session": session_from_row(row)}
