from data_access_sqlite.shared.errors import fail
from data_access_sqlite.shared.validation.assert_values import assert_instant


def assert_checked_in_at_in_session(
    checked_in_at: str | None,
    start_at: str,
    end_at: str,
) -> None:
    """El fichaje tiene que caer dentro de la sesión.

    No va en el modelo `Attendance` porque necesita los datos de otra entidad,
    la sesión: la llama el caso de uso que ya la ha leído.
    """
    if checked_in_at is None:
        return
    instant = assert_instant(checked_in_at, "attendance.checked_in_at")
    start = assert_instant(start_at, "session.start_at")
    end = assert_instant(end_at, "session.end_at")
    if instant < start or instant > end:
        fail("attendance.checked_in_at", "window")
