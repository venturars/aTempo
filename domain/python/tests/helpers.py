import os
import tempfile
from collections.abc import Callable
from pathlib import Path

from sqlalchemy import event

from python_domain.sqlite.pool import get_engine, reset_pool

SCHEMA_PATH = Path(__file__).resolve().parents[3] / "sqlite" / "schema.sql"

SESSION_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
COURSE_ID = "11111111-1111-1111-1111-111111111111"
PROFESSOR_ID = "22222222-2222-2222-2222-222222222222"
STUDENT_ID = "33333333-3333-3333-3333-333333333333"
OTHER_ID = "44444444-4444-4444-4444-444444444444"

valid_session_input = {
    "course_id": COURSE_ID,
    "professor_id": PROFESSOR_ID,
    "start_at": "2026-01-01T10:00:00.000Z",
    "end_at": "2026-01-01T12:00:00.000Z",
    "status": "open",
    "closed_at": None,
    "late_after_minutes": 10,
    "expected_count": 20,
}

valid_attendance = {
    "session_id": SESSION_ID,
    "student_id": STUDENT_ID,
    "status": "present",
    "check_in_method": "button",
    "checked_in_at": "2026-01-01T10:05:00.000Z",
}


def open_memory_db() -> None:
    os.environ["SQLITE_DATABASE_URL"] = "sqlite://"
    reset_pool()
    raw = get_engine().raw_connection()
    raw.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    raw.commit()
    # Devuelve la conexión al pool: si no, reset_pool() no la cierra y Windows
    # no puede borrar el fichero temporal.
    raw.close()


def close_memory_db() -> None:
    reset_pool()
    os.environ.pop("SQLITE_DATABASE_URL", None)


def open_file_db() -> str:
    fd, path = tempfile.mkstemp(suffix=".sqlite")
    os.close(fd)
    os.environ["SQLITE_DATABASE_URL"] = "sqlite:///" + Path(path).as_posix()
    reset_pool()
    raw = get_engine().raw_connection()
    raw.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    raw.commit()
    # Devuelve la conexión al pool: si no, reset_pool() no la cierra y Windows
    # no puede borrar el fichero temporal.
    raw.close()
    return path


def count_begins(fn: Callable[[], object]) -> int:
    begins: list[int] = []

    def on_begin(_connection) -> None:
        begins.append(1)

    engine = get_engine()
    event.listen(engine, "begin", on_begin)
    try:
        fn()
    finally:
        event.remove(engine, "begin", on_begin)
    return len(begins)
