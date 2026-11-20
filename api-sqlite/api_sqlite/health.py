"""Health endpoint and its input/output validation models."""

from flask import Blueprint, current_app, jsonify, request
from pydantic import BaseModel, ConfigDict, ValidationError
from sqlalchemy.exc import SQLAlchemyError

from api_sqlite.database import check_database

health_blueprint = Blueprint("health", __name__)


class HealthRequest(BaseModel):
    """Accept only an empty optional JSON object on the GET endpoint."""

    model_config = ConfigDict(extra="forbid")


class HealthResponse(BaseModel):
    """Validated response returned when SQLite is reachable."""

    status: str


@health_blueprint.get("/health")
def health_check():
    """Check SQLite availability.

    ---
    tags:
      - health
    responses:
      200:
        description: SQLite is available.
        schema:
          type: object
          required: [status]
          properties:
            status:
              type: string
              example: ok
      400:
        description: The optional JSON object is invalid.
      503:
        description: SQLite is unavailable.
    """
    if request.is_json:
        try:
            HealthRequest.model_validate(request.get_json())
        except (ValidationError, ValueError) as error:
            return jsonify({"error": "invalid health request"}), 400

    try:
        check_database(current_app.extensions["sqlite_engine"])
    except SQLAlchemyError:
        return jsonify({"error": "database unavailable"}), 503

    response = HealthResponse(status="ok")
    return jsonify(response.model_dump()), 200
