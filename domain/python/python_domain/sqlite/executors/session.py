from python_domain.sqlite.pool import SqliteQuery, query
from python_domain.sqlite.queries.session import (
    DELETE_SESSION,
    DELETE_SESSION_ATTENDANCES,
    GET_SESSION_BY_ID,
    INSERT_SESSION,
    LIST_SESSIONS,
    LIST_SESSIONS_BY_COURSE,
    LIST_SESSIONS_BY_PROFESSOR,
    UPDATE_SESSION,
)
from python_domain.types.session import Session


def retrieve_all_sessions(run: SqliteQuery = query) -> list[Session]:
    result = run(LIST_SESSIONS, None)
    return result.rows  # type: ignore[return-value]


def find_session_by_id(session_id: str, run: SqliteQuery = query) -> Session | None:
    result = run(GET_SESSION_BY_ID, {"id": session_id})
    if not result.rows:
        return None
    return result.rows[0]  # type: ignore[return-value]


def retrieve_all_sessions_by_course_id(
    course_id: str,
    run: SqliteQuery = query,
) -> list[Session]:
    result = run(LIST_SESSIONS_BY_COURSE, {"course_id": course_id})
    return result.rows  # type: ignore[return-value]


def retrieve_all_sessions_by_professor_id(
    professor_id: str,
    run: SqliteQuery = query,
) -> list[Session]:
    result = run(LIST_SESSIONS_BY_PROFESSOR, {"professor_id": professor_id})
    return result.rows  # type: ignore[return-value]


def add_session(
    session: Session,
    run: SqliteQuery = query,
) -> Session | None:
    result = run(INSERT_SESSION, dict(session))
    if not result.rows:
        return None
    return result.rows[0]  # type: ignore[return-value]


def insert_session_row(
    session: Session,
    run: SqliteQuery = query,
) -> Session | None:
    result = run(UPDATE_SESSION, dict(session))
    if not result.rows:
        return None
    return result.rows[0]  # type: ignore[return-value]


def remove_session_attendances(session_id: str, run: SqliteQuery = query) -> None:
    run(DELETE_SESSION_ATTENDANCES, {"id": session_id})


def remove_session_by_id(session_id: str, run: SqliteQuery = query) -> bool:
    result = run(DELETE_SESSION, {"id": session_id})
    return result.rowcount > 0
