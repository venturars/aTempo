import os
import threading
import time
import unittest
from types import MappingProxyType

from atempo_errors import (
    ConfigurationError,
    ConflictError,
    PersistenceError,
    ValidationError,
)
from sqlalchemy import event
from sqlalchemy.exc import StatementError

from data_access_sqlite.attendance.add_attendance import add_attendance
from data_access_sqlite.attendance.retrieve_all_attendances import (
    retrieve_all_attendances,
)
from data_access_sqlite.attendance.update_attendance import update_attendance
from data_access_sqlite.session.add_session import add_session
from data_access_sqlite.session.retrieve_all_sessions import retrieve_all_sessions
from data_access_sqlite.session.update_session import update_session
from data_access_sqlite.sqlite.check import check
from data_access_sqlite.sqlite.executors.session import remove_session_by_id
from data_access_sqlite.sqlite.pool import (
    get_engine,
    query,
    reset_pool,
    with_transaction,
)

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

    def test_unmapped_sqlite_error_is_persistence_error(self) -> None:
        open_memory_db()
        with self.assertRaisesRegex(PersistenceError, "error de SQLite") as caught:
            query("SELECT * FROM no_such_table")
        self.assertIn("no such table", str(caught.exception.__cause__))

        with self.assertRaises(PersistenceError):
            with_transaction(lambda run: run("SELECT * FROM no_such_table"))

    def test_missing_bind_parameter_is_not_a_persistence_error(self) -> None:
        open_memory_db()
        with self.assertRaises(StatementError) as caught:
            query("SELECT :missing")
        self.assertNotIsInstance(caught.exception, PersistenceError)

    def test_url_that_is_not_sqlite_is_a_configuration_error(self) -> None:
        for url in ("not a url", "mysql://user@host/db"):
            os.environ["SQLITE_DATABASE_URL"] = url
            reset_pool()
            with self.subTest(url=url):
                with self.assertRaisesRegex(ConfigurationError, "SQLITE_DATABASE_URL"):
                    query("SELECT 1")
        os.environ.pop("SQLITE_DATABASE_URL", None)
        reset_pool()

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

    def test_update_session_opens_one_transaction(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        begins = count_begins(
            lambda: update_session({
                "session": {**session.model_dump(), "expected_count": 21},
            }),
        )
        self.assertEqual(begins, 1)

    def test_add_and_update_attendance_open_one_transaction(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        row = {**valid_attendance, "session_id": session.id}
        self.assertEqual(
            count_begins(lambda: add_attendance({"attendance": row})),
            1,
        )
        self.assertEqual(
            count_begins(
                lambda: update_attendance({
                    "attendance": {**row, "status": "present_late"},
                }),
            ),
            1,
        )

    def test_concurrent_add_attendance_keeps_one_row(self) -> None:
        path = open_file_db()
        try:
            session = add_session({"session": valid_session_input})["session"]
            body = {**valid_attendance, "session_id": session.id}
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
                    {"id": session.id},
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
                    {"id": session.id},
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
                        {"id": session.id},
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

    def test_query_inside_a_transaction_uses_its_connection(self) -> None:
        open_memory_db()
        rows = with_transaction(lambda run: query("SELECT 1 AS one").rows)
        self.assertEqual(rows, [{"one": 1}])

    def test_every_memory_url_shares_one_database_across_threads(self) -> None:
        for url in (
            "sqlite+pysqlite://",
            "sqlite:///:memory:",
            "sqlite:///file:shared?mode=memory&uri=true",
        ):
            with self.subTest(url=url):
                os.environ["SQLITE_DATABASE_URL"] = url
                reset_pool()
                query("CREATE TABLE shared (value INTEGER)")
                errors: list[BaseException] = []

                def read_from_other_thread() -> None:
                    try:
                        query("SELECT value FROM shared")
                    except BaseException as error:
                        errors.append(error)

                thread = threading.Thread(target=read_from_other_thread)
                thread.start()
                thread.join()
                self.assertEqual(errors, [])

    def test_first_use_from_many_threads_creates_one_engine(self) -> None:
        open_memory_db()
        reset_pool()
        engines: list[object] = []
        start = threading.Barrier(8)

        def first_use() -> None:
            start.wait()
            engines.append(get_engine())

        threads = [threading.Thread(target=first_use) for _ in range(8)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()
        self.assertEqual(len({id(engine) for engine in engines}), 1)

    def test_deleting_a_session_with_attendances_is_a_conflict(self) -> None:
        open_memory_db()
        session = add_session({"session": valid_session_input})["session"]
        add_attendance({"attendance": {**valid_attendance, "session_id": session.id}})
        with self.assertRaisesRegex(ConflictError, "session todavía tiene asistencias"):
            remove_session_by_id(session.id)
        with self.assertRaisesRegex(ConflictError, "session todavía tiene asistencias"):
            with_transaction(lambda run: remove_session_by_id(session.id, run))

    def test_missing_input_field_is_a_validation_error(self) -> None:
        open_memory_db()
        for bad_input in ({}, "session", None):
            with self.subTest(bad_input=bad_input):
                with self.assertRaisesRegex(ValidationError, "session es obligatorio"):
                    add_session(bad_input)  # type: ignore[arg-type]

    def test_transaction_inside_a_transaction_joins_it(self) -> None:
        open_memory_db()
        rows = with_transaction(
            lambda outer: with_transaction(lambda inner: inner("SELECT 1 AS one").rows)
        )
        self.assertEqual(rows, [{"one": 1}])

    def test_reset_waits_for_a_memory_transaction_in_another_thread(self) -> None:
        open_memory_db()
        inside = threading.Event()
        results: list[object] = []

        def long_transaction(run) -> None:
            inside.set()
            time.sleep(0.2)
            results.append(run("SELECT 1 AS one").rows)

        worker = threading.Thread(target=lambda: with_transaction(long_transaction))
        worker.start()
        inside.wait()
        reset_pool()
        worker.join()
        self.assertEqual(results, [[{"one": 1}]])

    def test_input_can_be_any_mapping(self) -> None:
        open_memory_db()
        created = add_session(MappingProxyType({"session": valid_session_input}))  # type: ignore[arg-type]
        self.assertEqual(created["session"].course_id, valid_session_input["course_id"])


if __name__ == "__main__":
    unittest.main()
