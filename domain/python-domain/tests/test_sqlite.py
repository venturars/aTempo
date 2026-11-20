import os
import tempfile
import threading
import time
import unittest
from pathlib import Path

from sqlalchemy import event

from python_domain.session.create_session import create_session
from python_domain.sqlite.check import check
from python_domain.sqlite.db import get_engine, query, reset_db, with_transaction

from helpers import (
    SCHEMA_PATH,
    close_memory_db,
    open_memory_db,
    valid_session_input,
)


class SqliteTests(unittest.TestCase):
    def tearDown(self) -> None:
        close_memory_db()

    def test_throws_when_url_is_missing(self) -> None:
        os.environ.pop("SQLITE_DATABASE_URL", None)
        reset_db()
        with self.assertRaisesRegex(RuntimeError, "Falta SQLITE_DATABASE_URL"):
            check()

    def test_pings_with_select_1(self) -> None:
        open_memory_db()
        check()

    def test_select_rowcount_is_not_negative(self) -> None:
        open_memory_db()
        result = query("SELECT 1")
        self.assertGreaterEqual(result.rowcount, 0)
        self.assertEqual(len(result.rows), 1)

    def test_select_inside_with_transaction_starts_a_transaction(self) -> None:
        open_memory_db()
        in_transaction: list[bool] = []

        def after_execute(conn, *_args):
            dbapi = conn.connection.dbapi_connection
            in_transaction.append(bool(dbapi.in_transaction))

        engine = get_engine()
        event.listen(engine, "after_execute", after_execute)
        try:

            def run(tx):
                tx("SELECT 1")

            with_transaction(run)
        finally:
            event.remove(engine, "after_execute", after_execute)

        self.assertTrue(in_transaction)
        self.assertTrue(in_transaction[-1])

    def test_other_connection_cannot_write_until_transaction_ends(self) -> None:
        fd, path = tempfile.mkstemp(suffix=".sqlite")
        os.close(fd)
        os.environ["SQLITE_DATABASE_URL"] = "sqlite:///" + Path(path).as_posix()
        reset_db()
        raw = get_engine().raw_connection()
        raw.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        raw.commit()
        try:
            session = create_session(valid_session_input)
            started = threading.Event()
            release = threading.Event()
            errors: list[BaseException] = []

            def hold(tx):
                tx(
                    "SELECT id FROM session WHERE id = :id",
                    {"id": session["id"]},
                )
                started.set()
                if not release.wait(timeout=5):
                    raise TimeoutError("release")

            holder = threading.Thread(
                target=lambda: with_transaction(hold),
                daemon=True,
            )
            holder.start()
            self.assertTrue(started.wait(timeout=2))

            def write() -> None:
                try:
                    query(
                        "UPDATE session SET expected_count = 99 WHERE id = :id",
                        {"id": session["id"]},
                    )
                except BaseException as error:
                    errors.append(error)

            writer = threading.Thread(target=write, daemon=True)
            writer.start()
            time.sleep(0.3)
            self.assertTrue(writer.is_alive())
            release.set()
            holder.join(timeout=2)
            writer.join(timeout=2)
            self.assertFalse(holder.is_alive())
            self.assertFalse(writer.is_alive())
            self.assertEqual(errors, [])
        finally:
            close_memory_db()
            try:
                os.unlink(path)
            except OSError:
                pass


if __name__ == "__main__":
    unittest.main()
