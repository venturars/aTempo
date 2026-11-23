from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.sqlite.db import QueryFn, query
from python_domain.types.assert_values import assert_uuid
from python_domain.types.attendance import Attendance, assert_attendance

SELECT = f"""SELECT {ATTENDANCE_COLUMNS}
FROM attendance
WHERE session_id = :session_id"""


def list_attendances_by_session(
    session_id: str,
    run: QueryFn = query,
) -> list[Attendance]:
    session_id = assert_uuid(session_id, "attendance.session_id")
    result = run(SELECT, {"session_id": session_id})
    return [assert_attendance(row) for row in result.rows]
