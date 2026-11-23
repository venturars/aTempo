from typing import TypedDict
from uuid import uuid4

from python_domain.errors import PersistenceError
from python_domain.sqlite.executors.session import insert_session
from python_domain.types.session import (
    Session,
    SessionCreate,
    assert_session,
    assert_session_create,
)


class CreateSessionInput(TypedDict):
    session: SessionCreate


class CreateSessionOutput(TypedDict):
    session: Session


def create_session(input: CreateSessionInput) -> CreateSessionOutput:
    body = assert_session_create(input["session"])
    row = insert_session({"id": str(uuid4()), **body})
    if row is None:
        raise PersistenceError("session no se ha creado", entity="session")
    return {"session": assert_session(row)}
