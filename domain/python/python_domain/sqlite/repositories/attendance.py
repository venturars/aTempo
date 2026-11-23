from python_domain.sqlite.pool import SqliteQuery, query
from python_domain.sqlite.queries.attendance import (
    DELETE_ATTENDANCE,
    FIND_ATTENDANCE,
    INSERT_ATTENDANCE,
    LIST_ATTENDANCES,
    LIST_ATTENDANCES_BY_SESSION,
    UPDATE_ATTENDANCE,
)
from python_domain.types.attendance import Attendance


def list_attendances(run: SqliteQuery = query) -> list[Attendance]:
    result = run(LIST_ATTENDANCES, None)
    return result.rows  # type: ignore[return-value]


def list_attendances_by_session_id(
    session_id: str,
    run: SqliteQuery = query,
) -> list[Attendance]:
    result = run(LIST_ATTENDANCES_BY_SESSION, {"session_id": session_id})
    return result.rows  # type: ignore[return-value]


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


def insert_attendance(
    attendance: Attendance,
    run: SqliteQuery = query,
) -> Attendance | None:
    result = run(INSERT_ATTENDANCE, dict(attendance))
    if not result.rows:
        return None
    return result.rows[0]  # type: ignore[return-value]


def update_attendance_row(
    attendance: Attendance,
    run: SqliteQuery = query,
) -> Attendance | None:
    result = run(UPDATE_ATTENDANCE, dict(attendance))
    if not result.rows:
        return None
    return result.rows[0]  # type: ignore[return-value]


def delete_attendance(
    session_id: str,
    student_id: str,
    run: SqliteQuery = query,
) -> bool:
    result = run(
        DELETE_ATTENDANCE,
        {"session_id": session_id, "student_id": student_id},
    )
    return result.rowcount > 0
