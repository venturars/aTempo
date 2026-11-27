from typing import cast

from data_access_sqlite.shared.types.attendance import (
    Attendance,
    AttendanceStatus,
    CheckInMethod,
)
from data_access_sqlite.shared.validation.assert_values import (
    assert_nullable_string,
    assert_row,
    assert_string,
)


def attendance_from_row(value: object) -> Attendance:
    """Lee una fila de attendance que viene de SQLite.

    Solo comprueba la forma. El esquema ya garantiza el estado, el método, el
    formato de `checked_in_at` y que encajen entre sí. Un id que no es uuid no
    rompe el listado entero y sale tal como está guardado. `model_construct`
    crea el modelo sin volver a validarlo.
    """
    row = assert_row(value, "attendance")
    return Attendance.model_construct(
        session_id=assert_string(row.get("session_id"), "attendance.session_id"),
        student_id=assert_string(row.get("student_id"), "attendance.student_id"),
        status=cast(
            AttendanceStatus,
            assert_string(row.get("status"), "attendance.status"),
        ),
        check_in_method=cast(
            CheckInMethod | None,
            assert_nullable_string(
                row.get("check_in_method"),
                "attendance.check_in_method",
            ),
        ),
        checked_in_at=assert_nullable_string(
            row.get("checked_in_at"),
            "attendance.checked_in_at",
        ),
    )
