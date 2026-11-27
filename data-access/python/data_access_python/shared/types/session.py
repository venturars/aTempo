from datetime import datetime
from typing import Annotated, Literal, Self, get_args

from pydantic import ConfigDict, model_validator

from data_access_python.shared.errors import fail
from data_access_python.shared.types.contract import Contract
from data_access_python.shared.validation.fields import (
    Instant,
    NonNegativeInt,
    NullableInstant,
    NullableNonNegativeInt,
    Uuid,
    one_of,
)

SessionStatus = Literal["open", "closing", "closed"]


class SessionCreate(Contract):
    """Una sesión de clase antes de guardarla: sin `id`.

    Los instantes entran con `Z` o un desfase y quedan en ISO UTC con
    milisegundos (`2026-09-01T08:00:00.000Z`). Los UUID quedan en minúsculas.
    """

    model_config = ConfigDict(title="session")

    course_id: Uuid
    professor_id: Uuid
    start_at: Instant
    end_at: Instant
    status: Annotated[SessionStatus, one_of(get_args(SessionStatus))]
    closed_at: NullableInstant = None
    late_after_minutes: NonNegativeInt
    expected_count: NullableNonNegativeInt = None

    @model_validator(mode="after")
    def check_session_rules(self) -> Self:
        if datetime.fromisoformat(self.end_at) <= datetime.fromisoformat(
            self.start_at
        ):
            fail("session.end_at", "order")
        if self.status == "closed" and self.closed_at is None:
            fail("session.closed_at", "required")
        if self.status != "closed" and self.closed_at is not None:
            fail("session.closed_at", "forbidden")
        return self


class Session(SessionCreate):
    """Una sesión guardada: lleva su `id`."""

    id: Uuid


SessionUpdate = Session
