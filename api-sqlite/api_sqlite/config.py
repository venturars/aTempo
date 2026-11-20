"""Environment-backed settings for the local persistence service."""

import os


def load_settings() -> dict[str, object]:
    """Return Flask settings, keeping this database separate from Electron."""
    return {
        "PORT": int(os.getenv("PORT", "3002")),
        "SQLITE_DATABASE_URL": os.getenv(
            "SQLITE_DATABASE_URL", "sqlite:///./api-sqlite.sqlite"
        ),
        "SWAGGER": {
            "title": "aTempo SQLite API",
            "uiversion": 3,
            "specs_route": "/docs",
            "specs": [
                {
                    "endpoint": "openapi",
                    "route": "/docs-json",
                    "rule_filter": lambda rule: rule.rule == "/health",
                    "model_filter": lambda tag: True,
                }
            ],
        },
    }
