from python_domain.sqlite.pool import query


def check() -> dict[str, bool]:
    query("SELECT 1")
    return {"ok": True}
