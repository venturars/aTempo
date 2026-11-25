import unittest

from python_domain.errors import ValidationError
from python_domain.session.add_session import add_session
from python_domain.session.retrieve_session_by_id import retrieve_session_by_id
from python_domain.session.retrieve_all_sessions import retrieve_all_sessions

from helpers import (
    SESSION_ID,
    close_memory_db,
    open_memory_db,
    valid_session_input,
)


class ReadTests(unittest.TestCase):
    def setUp(self) -> None:
        open_memory_db()

    def tearDown(self) -> None:
        close_memory_db()

    def test_does_not_query_when_id_is_not_uuid(self) -> None:
        with self.assertRaisesRegex(ValidationError, "session.id debe ser un uuid"):
            retrieve_session_by_id({"id": "no-es-uuid"})

    def test_returns_none_when_session_does_not_exist(self) -> None:
        self.assertIsNone(retrieve_session_by_id({"id": SESSION_ID})["session"])

    def test_returns_a_session_after_create(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        found = retrieve_session_by_id({"id": created["id"]})["session"]
        self.assertEqual(found, created)

    def test_finds_a_session_when_the_id_differs_only_by_case(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        found = retrieve_session_by_id({"id": created["id"].upper()})["session"]
        self.assertEqual(found, created)

    def test_lists_sessions(self) -> None:
        created = add_session({"session": valid_session_input})["session"]
        self.assertEqual(retrieve_all_sessions()["sessions"], [created])


if __name__ == "__main__":
    unittest.main()
