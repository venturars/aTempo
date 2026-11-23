from python_domain.attendance.columns import ATTENDANCE_COLUMNS
from python_domain.sqlite.db import query
from python_domain.types.attendance import Attendance, assert_attendance

SELECT = f"SELECT {ATTENDANCE_COLUMNS} FROM attendance"


def list_attendances() -> list[Attendance]:
    result = query(SELECT)
    return [assert_attendance(row) for row in result.rows]
