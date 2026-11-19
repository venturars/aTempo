from python_domain.sqlite.db import query


def check() -> None:
    query("SELECT 1")
