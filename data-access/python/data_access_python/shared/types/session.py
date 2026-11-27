from typing import Literal, TypedDict

SessionStatus = Literal["open", "closing", "closed"]


class Session(TypedDict):
    id: str
    course_id: str
    professor_id: str
    start_at: str
    end_at: str
    status: SessionStatus
    closed_at: str | None
    late_after_minutes: int
    expected_count: int | None


class SessionCreate(TypedDict):
    course_id: str
    professor_id: str
    start_at: str
    end_at: str
    status: SessionStatus
    closed_at: str | None
    late_after_minutes: int
    expected_count: int | None


SessionUpdate = Session
