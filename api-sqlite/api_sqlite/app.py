"""Flask application factory for the SQLite persistence API."""

from flask import Flask
from flasgger import Swagger
from sqlalchemy import Engine

from api_sqlite.config import load_settings
from api_sqlite.database import create_database_engine
from api_sqlite.health import health_blueprint


def create_app(settings: dict[str, object] | None = None) -> Flask:
    """Build a configured service app, with overrides useful to callers."""
    app = Flask(__name__)
    app.config.from_mapping(load_settings())
    if settings:
        app.config.update(settings)

    engine: Engine = create_database_engine(str(app.config["SQLITE_DATABASE_URL"]))
    app.extensions["sqlite_engine"] = engine
    app.register_blueprint(health_blueprint)
    Swagger(app)
    return app
