import os
import threading
import time
import unittest

from sqlalchemy import event

from python_domain.attendance.add_attendance import add_attendance
from python_domain.attendance.list_attendances import list_attendances
from python_domain.attendance.update_attendance import update_attendance
from python_domain.session.create_session import create_session
from python_domain.session.update_session import update_session
from python_domain.sqlite.check import check
from python_domain.sqlite.db import get_engine, query, reset_db, with_transaction

from helpers import (
    STUDENT_ID,
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

    def test_update_session_opens_one_transaction(self) -> None:
        open_memory_db()
        session = create_session(valid_session_input)
        begins = count_begins(
            lambda: update_session({**session, "expected_count": 21}),
        )
        self.assertEqual(begins, 1)

    def test_add_and_update_attendance_open_one_transaction(self) -> None:
        open_memory_db()
        session = create_session(valid_session_input)
        row = {**valid_attendance, "session_id": session["id"]}
        self.assertEqual(count_begins(lambda: add_attendance(row)), 1)
        self.assertEqual(
            count_begins(
                lambda: update_attendance({**row, "status": "present_late"}),
            ),
            1,
        )

    def test_concurrent_add_attendance_keeps_one_row(self) -> None:
        path = open_file_db()
        try:
            session = create_session(valid_session_input)
            body = {**valid_attendance, "session_id": session["id"]}
            results: list[object] = []
            errors: list[BaseException] = []

            def worker() -> None:
                try:
                    results.append(add_attendance(body))
                except BaseException as error:
                    errors.append(error)

            first = threading.Thread(target=worker)
            second = threading.Thread(target=worker)
            first.start()
            second.start()
            first.join(timeout=5)
            second.join(timeout=5)
            self.assertEqual(len(results), 1)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], ValueError)
            self.assertIn("attendance ya existe", str(errors[0]))
            self.assertEqual(len(list_attendances()), 1)
        finally:
            close_memory_db()
            try:
                os.unlink(path)
            except OSError:
                pass

    def test_concurrent_update_attendance_does_not_raise(self) -> None:
        path = open_file_db()
        try:
            session = create_session(valid_session_input)
            created = add_attendance({
                **valid_attendance,
                "session_id": session["id"],
            })
            errors: list[BaseException] = []

            def worker() -> None:
                try:
                    update_attendance({
                        **created,
                        "student_id": STUDENT_ID,
                        "status": "present_late",
                    })
                except BaseException as error:
                    errors.append(error)

            first = threading.Thread(target=worker)
            second = threading.Thread(target=worker)
            first.start()
            second.start()
            first.join(timeout=5)
            second.join(timeout=5)
            self.assertEqual(errors, [])
            self.assertEqual(len(list_attendances()), 1)
        finally:
            close_memory_db()
            try:
                os.unlink(path)
            except OSError:
                pass

    def test_other_connection_cannot_write_until_transaction_ends(self) -> None:
        path = open_file_db()
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
