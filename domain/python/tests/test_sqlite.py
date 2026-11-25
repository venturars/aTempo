import os
import threading
import time
import unittest

from sqlalchemy import event

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.retrieve_all_attendances import retrieve_all_attendances
from python_domain.attendance.insert_attendance import insert_attendance
from python_domain.errors import ConfigurationError, ConflictError
from python_domain.session.add_session import add_session
from python_domain.session.retrieve_all_sessions import retrieve_all_sessions
from python_domain.session.insert_session import insert_session
from python_domain.sqlite.check import check
from python_domain.sqlite.pool import get_engine, query, reset_pool, with_transaction

from helpers import (
    close_memory_db,
    count_begins,
    open_file_db,
    open_memory_db,
    valid_attendance,
    valid_session_input,
)


class SqliteTests(unittest.TestCase):
    def tearDown(self) -> None:
        close_memory_db()

    def test_throws_when_url_is_missing(self) -> None:
        os.environ.pop("SQLITE_DATABASE_URL", None)
        reset_pool()
        with self.assertRaisesRegex(ConfigurationError, "Falta SQLITE_DATABASE_URL"):
            check()

    def test_pings_with_select_1(self) -> None:
        open_memory_db()
        self.assertEqual(check(), {"ok": True})

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

    def test_insert_session_opens_one_transaction(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        begins = count_begins(
            lambda: insert_session({
                "session": {**session, "expected_count": 21},
            }),
        )
        self.assertEqual(begins, 1)

    def test_add_and_insert_attendance_open_one_transaction(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        row = {**valid_attendance, "session_id": session["id"]}
        self.assertEqual(
            count_begins(lambda: add_attendance({"attendance": row})),
            1,
        )
        self.assertEqual(
            count_begins(
                lambda: insert_attendance({
                    "attendance": {**row, "status": "present_late"},
                }),
            ),
            1,
        )

    def test_concurrent_add_attendance_keeps_one_row(self) -> None:
        path = open_file_db()
        try:
            session = add_session({"session": valid_session_input})["session"]
            body = {**valid_attendance, "session_id": session["id"]}
            results: list[object] = []
            errors: list[BaseException] = []

            def delay_lookup(_conn, _cursor, statement, *_args) -> None:
                if "FROM attendance" in statement and "INSERT" not in statement:
                    time.sleep(0.2)

            engine = get_engine()
            event.listen(engine, "before_cursor_execute", delay_lookup)
            try:

                def worker() -> None:
                    try:
                        results.append(add_attendance({"attendance": body}))
                    except BaseException as error:
                        errors.append(error)

                first = threading.Thread(target=worker)
                second = threading.Thread(target=worker)
                first.start()
                second.start()
                first.join(timeout=5)
                second.join(timeout=5)
            finally:
                event.remove(engine, "before_cursor_execute", delay_lookup)

            self.assertEqual(len(results), 1)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], ConflictError)
            self.assertIn("attendance ya existe", str(errors[0]))
            self.assertEqual(len(retrieve_all_attendances()["attendances"]), 1)
        finally:
            close_memory_db()
            try:
                os.unlink(path)
            except OSError:
                pass

    def test_read_does_not_block_during_write_transaction(self) -> None:
        path = open_file_db()
        try:
            session = add_session({"session": valid_session_input})["session"]
            started = threading.Event()
            release = threading.Event()
            listed: list[object] = []
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

            def read() -> None:
                try:
                    listed.extend(retrieve_all_sessions()["sessions"])
                except BaseException as error:
                    errors.append(error)

            reader = threading.Thread(target=read, daemon=True)
            reader.start()
            reader.join(timeout=2)
            self.assertFalse(reader.is_alive())
            self.assertEqual(errors, [])
            self.assertEqual(len(listed), 1)
            release.set()
            holder.join(timeout=2)
            self.assertFalse(holder.is_alive())
        finally:
            close_memory_db()
            try:
                os.unlink(path)
            except OSError:
                pass

    def test_other_connection_cannot_write_until_transaction_ends(self) -> None:
        path = open_file_db()
        try:
            session = add_session({"session": valid_session_input})["session"]
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
