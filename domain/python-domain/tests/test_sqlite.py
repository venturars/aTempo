import os
import unittest

from python_domain.sqlite.check import check
from python_domain.sqlite.db import reset_db

from helpers import close_memory_db, open_memory_db


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


if __name__ == "__main__":
    unittest.main()
