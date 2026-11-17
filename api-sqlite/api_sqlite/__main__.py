"""Run the local API with ``python -m api_sqlite``."""

from api_sqlite.app import create_app

app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(app.config["PORT"]))
