from typing import TypedDict
from uuid import uuid4

from python_domain.errors import fail
from python_domain.sqlite.executors.session import add_session as add_session_row
from python_domain.types.session import (
    Session,
    SessionCreate,
    assert_session_create,
    session_from_row,
)
from python_domain.types.assert_values import read_input_field


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
