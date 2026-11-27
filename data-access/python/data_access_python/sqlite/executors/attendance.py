from data_access_python.sqlite.pool import SqliteParams, SqliteQuery, SqliteRow, query
from data_access_python.sqlite.queries.attendance import (
    DELETE_ATTENDANCE,
    FIND_ATTENDANCE,
    INSERT_ATTENDANCE,
    LIST_ATTENDANCES,
    LIST_ATTENDANCES_BY_SESSION,
    UPDATE_ATTENDANCE,
)


def retrieve_all_attendances(run: SqliteQuery = query) -> list[SqliteRow]:
    result = run(LIST_ATTENDANCES, None)
    return result.rows


def retrieve_all_attendances_by_session_id(
    session_id: str,
    run: SqliteQuery = query,
) -> list[SqliteRow]:
    result = run(LIST_ATTENDANCES_BY_SESSION, {"session_id": session_id})
    return result.rows


def attendance_exists(
    session_id: str,
    student_id: str,
    run: SqliteQuery = query,
) -> bool:
    result = run(
        FIND_ATTENDANCE,
        {"session_id": session_id, "student_id": student_id},
    )
    return bool(result.rows)


def add_attendance(
    attendance: SqliteParams,
    run: SqliteQuery = query,
) -> SqliteRow | None:
    result = run(INSERT_ATTENDANCE, attendance)
    if not result.rows:
        return None
    return result.rows[0]


def update_attendance_row(
    attendance: SqliteParams,
    run: SqliteQuery = query,
) -> SqliteRow | None:
    result = run(UPDATE_ATTENDANCE, attendance)
    if not result.rows:
        return None
    return result.rows[0]


def remove_attendance(
    session_id: str,
    student_id: str,
    run: SqliteQuery = query,
) -> bool:
    result = run(
        DELETE_ATTENDANCE,
        {"session_id": session_id, "student_id": student_id},
    )
    return result.rowcount > 0
