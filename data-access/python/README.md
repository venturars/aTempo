# python

SDK Python de aTempo (`data-access-python`, se importa como `data_access_python`). Paquete librería dentro de `data-access/`. Tipos de `session` y `attendance`, lecturas, escrituras y reglas de SQLite operativo. No es un servicio HTTP.

El flujo de producto es Frontend → `api-sqlite` → `data-access/python` → SQLite. Este paquete abre la base. Flask no escribe SQL.

Las funciones públicas reciben y devuelven un objeto (RORO). Las queries viven en `data_access_python/sqlite/queries/`. El pool y los ejecutores viven en `data_access_python/sqlite/`. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El campo `id` identifica el caso (`attendance.taken`, `session.end_at.order`). El campo `kind` es `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `CONFIGURATION` o `PERSISTENCE`. Se busca en el catálogo de `data_access_python/shared/errors.py`. Las clases vienen de `atempo_errors` (`errors/python/`), y `shared/errors.py` crea `domain_error` y `fail` con su `create_error_factory`. El paquete lanza con `fail(label, reason)`. Un UNIQUE o un FOREIGN KEY de SQLite reutiliza el mismo `id` que el find; cualquier otro error de SQLite (un CHECK, `no such table`) es `sqlite.unmapped`.

## Contratos

`Session`, `SessionCreate` y `Attendance` son modelos Pydantic en `data_access_python/shared/types/`. Heredan de `Contract`, que les da `strict=True` y `frozen=True`; cada uno pone su entidad en `title`. Un modelo no convierte tipos (`"1"` no vale como entero) y no se puede modificar una vez validado. Cada campo pasa por un `assert_*` de `shared/validation/` antes de que Pydantic lo compruebe, así que un campo inválido lanza el error del catálogo (`session.course_id debe ser un uuid`). Las reglas entre campos (`end_at > start_at`, `closed_at` según el estado, el fichaje según el estado de asistencia) van en el modelo. La ventana del fichaje dentro de la sesión necesita la sesión guardada: la comprueba el caso de uso con `assert_checked_in_at_in_session`. Se valida con `validate_model(SessionCreate, datos)` y no con `model_validate` directamente: `validate_model` convierte cualquier error de Pydantic que se escape en un `ValidationError` del catálogo con el reason `format`, así que hacia fuera solo salen errores del catálogo.

Las funciones reciben un dict y devuelven modelos dentro del objeto RORO: `add_session({"session": {...}})["session"].status`. Para JSON, `model_dump(mode="json")`. Los envoltorios (`AddSessionInput`, `AddSessionOutput`…) son `TypedDict`.

## Instalar y probar

Con [uv](https://docs.astral.sh/uv/) 0.12.15, desde `data-access/python/`:

```sh
uv sync --locked
uv run python -m unittest discover -s tests -v
```

`uv sync --locked` crea `.venv`, instala las versiones de `uv.lock` e instala `atempo-errors` como editable desde `../../errors/python` (`[tool.uv.sources]` en `pyproject.toml`): un cambio en `errors/python/` se ve sin reinstalar. Los mismos comandos sirven en Windows PowerShell y en macOS/Linux.

Las pruebas usan SQLite en memoria y cargan `sqlite/schema.sql`. PostgreSQL no tiene que estar en marcha. `query()` abre un `BEGIN` diferido; `with_transaction` usa `BEGIN IMMEDIATE` para las escrituras que comprueban y luego insertan. `find_session_exists` y `find_attendance_available` reciben esa `tx`. Una `query()` o un `with_transaction` que se llaman dentro de `with_transaction` usan la conexión de esa transacción en lugar de abrir otra. Una URL en memoria (`sqlite://`, `sqlite+pysqlite://`, `sqlite:///:memory:` o una URI con `mode=memory`) da una sola base compartida por todos los hilos, que la usan de uno en uno; es para pruebas. `update_session` y `update_attendance` hacen un UPDATE: si la fila no existe, devuelven `None`. Si al objeto de entrada le falta su clave (`{"session": …}`), el caso de uso lanza `ValidationError`. Borrar una sesión que aún tiene asistencias es `ConflictError`.

El analizador de tipos (basedpyright) usa este `.venv`. Si Cursor sigue marcando `sqlalchemy` como no resuelto, elige el intérprete `data-access/python/.venv` o recarga la ventana.

Antes de un INSERT o UPDATE, el paquete comprueba las reglas. Si fallan, no escribe. El CHECK de SQLite se queda: solo acepta el ISO UTC con milisegundos, y en asistencia exige fichaje con `present` y `present_late` y lo prohíbe en `absent` y `notified_absence`. Un UNIQUE o un FOREIGN KEY de SQLite se traduce al mismo `id` de dominio. Cualquier otro error que lanza SQLite (un CHECK, `database is locked`, `no such table`) es `sqlite.unmapped`, con el error de SQLAlchemy como causa. Una `SQLITE_DATABASE_URL` que no se puede leer o que no es de SQLite es `ConfigurationError`. Un UUID o una fecha con un salto de línea al final no son válidos. `query` no forma parte de la API pública.

`start_at`, `end_at`, `closed_at` y `checked_in_at` entran con `Z` o un desfase y se guardan en ISO UTC (`2026-09-01T08:00:00.000Z`). Los UUID se guardan en minúsculas. `present` y `present_late` llevan `check_in_method` y `checked_in_at` dentro de la ventana de la sesión; `absent` y `notified_absence` van sin fichaje. No se comprueba la matrícula: `course_id` y `student_id` apuntan al core sin FK. `closed_at` solo va con el estado `closed`. Un remove de sesión borra las filas de `attendance` en la misma transacción. Un INSERT o UPDATE de sesión o asistencia lee la fila en el mismo `RETURNING`. Las filas que salen de SQLite pasan por `session_from_row` y `attendance_from_row` (`data_access_python/sqlite/rows/`), que solo comprueban la forma y crean el modelo con `model_construct`, sin validarlo: una fila guardada que la entrada no aceptaría (un id que no es uuid, una fecha como `2026-02-30`, un entero negativo) no rompe el listado entero y sale tal como está guardada.

## Conexión

La conexión real usa `SQLITE_DATABASE_URL`. `check()` ejecuta `SELECT 1` y devuelve `{ "ok": True }`. El esquema vive en `sqlite/schema.sql`; este paquete no crea las tablas.
