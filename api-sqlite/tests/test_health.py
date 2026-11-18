"""Behavioral tests for the SQLite health endpoint and its API docs."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy.exc import OperationalError

from api_sqlite.app import create_app


class HealthEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        database_path = Path(self.temporary_directory.name) / "health.sqlite"
        self.app = create_app(
            {"TESTING": True, "SQLITE_DATABASE_URL": f"sqlite:///{database_path}"}
        )
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.app.extensions["sqlite_engine"].dispose()
        self.temporary_directory.cleanup()

    def test_health_confirms_sqlite_without_creating_tables(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})
        engine = self.app.extensions["sqlite_engine"]
        with engine.connect() as connection:
            table_names = connection.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).scalars().all()
        self.assertEqual(table_names, [])

    def test_unavailable_database_returns_service_unavailable(self) -> None:
        database_error = OperationalError("SELECT 1", {}, Exception("offline"))
        with patch(
            "api_sqlite.health.check_database", side_effect=database_error
        ):
            response = self.client.get("/health")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json(), {"error": "database unavailable"})

    def test_extra_json_field_is_rejected_before_database_access(self) -> None:
        with patch("api_sqlite.health.check_database") as database_check:
            response = self.client.get("/health", json={"unexpected": True})

        self.assertEqual(response.status_code, 400)
        database_check.assert_not_called()

    def test_malformed_json_is_rejected_before_database_access(self) -> None:
        with patch("api_sqlite.health.check_database") as database_check:
            response = self.client.get(
                "/health", data="{", content_type="application/json"
            )

        self.assertEqual(response.status_code, 400)
        database_check.assert_not_called()

    def test_swagger_ui_openapi_json_and_assets_are_served(self) -> None:
        docs_response = self.client.get("/docs")
        openapi_response = self.client.get("/docs-json")

        self.assertEqual(docs_response.status_code, 200)
        self.assertIn(b"swagger-ui", docs_response.data.lower())
        self.assertEqual(openapi_response.status_code, 200)
        openapi = openapi_response.get_json()
        self.assertIn("/health", openapi["paths"])
        health_operation = openapi["paths"]["/health"]["get"]
        self.assertEqual(health_operation["tags"], ["health"])
        self.assertNotIn("requestBody", health_operation)

        swagger_asset = self.client.get("/flasgger_static/swagger-ui-bundle.js")
        self.assertEqual(swagger_asset.status_code, 200)
        self.assertGreater(len(swagger_asset.data), 0)
        swagger_asset.close()


if __name__ == "__main__":
    unittest.main()
