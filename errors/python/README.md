# errors

Paquete `atempo-errors` (se importa como `atempo_errors`). Clases de error y una fábrica que construye errores a partir de un catálogo. No conoce aTempo: no tiene labels, reasons ni mensajes propios. Cada paquete que lo usa trae su catálogo. Es el equivalente en Python de `@atempo/errors`.

## Qué exporta

- `DomainError` y sus subclases `ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` y `PersistenceError`. Heredan de `Exception`. Cada error lleva `kind` e `id`. Los que crea la fábrica llevan también `entity` y, solo si la label tiene punto, `field`.
- El tipo `DomainErrorKind` (`VALIDATION`, `NOT_FOUND`, `CONFLICT`, `CONFIGURATION`, `PERSISTENCE`).
- `label_parts(label)`, que parte `session.end_at` en `{"entity": "session", "field": "end_at"}`. Una label sin punto, como `session`, da `{"entity": "session"}`.
- `create_error_factory(reasons, messages=None)`, que devuelve `ErrorFactory(domain_error, fail)`. `domain_error(label, reason)` devuelve el error con `id` `label.reason`; `fail(label, reason, cause=...)` lo lanza con `raise ... from cause`. El mensaje sale de `messages[id]` si existe y, si no, de `reasons[reason]["message"](label)`. Una reason que no está en el catálogo lanza `KeyError`.
- Los tipos `ErrorReason` y `ErrorFactory`.

```python
from atempo_errors import create_error_factory

factory = create_error_factory({
    "taken": {"kind": "CONFLICT", "message": lambda label: f"{label} ya existe"},
})

factory.fail("thing.code", "taken")  # lanza ConflictError con id thing.code.taken
```

El paquete que usa la fábrica envuelve `domain_error` y `fail` con su tipo escrito (sus `Literal` de labels y reasons), como hace `data-access/sqlite/data_access_sqlite/shared/errors.py`. Así el analizador de tipos rechaza una label o una reason fuera del catálogo.

## Cómo se instala

No se publica en PyPI. `data-access/sqlite/` lo declara en `dependencies` y lo enlaza como editable con `[tool.uv.sources] atempo-errors = { path = "../../errors/python", editable = true }`. Su `uv.lock` lo registra como `editable = "../../errors/python"`, así que uv nunca lo busca en PyPI.

## Instalar y probar

Con uv 0.12.15, desde `errors/python/`:

```sh
uv sync --locked
uv run python -m unittest discover -s tests -v
```
