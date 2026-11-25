from typing import TypedDict
from uuid import uuid4

from python_domain.errors import PersistenceError
from python_domain.sqlite.executors.session import add_session as add_session_row
from python_domain.types.session import (
    Session,
    SessionCreate,
    assert_session,
    assert_session_create,
)


class AddSessionInput(TypedDict):
    session: SessionCreate


class AddSessionOutput(TypedDict):
    session: Session


def add_session(input: AddSessionInput) -> AddSessionOutput:
    body = assert_session_create(input["session"])
    row = add_session_row({"id": str(uuid4()), **body})
    if row is None:
        raise PersistenceError("session no se ha creado", entity="session")
    return {"session": assert_session(row)}
