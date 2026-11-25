# python

SDK Python de aTempo. Paquete librería dentro de `domain/`. Tipos de `session` y `attendance`, lecturas, escrituras y reglas de SQLite operativo. No es un servicio HTTP.

El flujo de producto es Frontend → `api-sqlite` → `domain/python` → SQLite. Este paquete abre la base. Flask no escribe SQL.

Las funciones públicas reciben y devuelven un objeto (RORO). Las queries viven en `python_domain/sqlite/queries/`. El pool y los ejecutores viven en `python_domain/sqlite/`. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El campo `id` identifica el caso (`attendance.taken`, `session.end_at.order`). Se busca en `python_domain/errors/catalog.py`. El paquete lanza con `fail(label, reason)`. Un UNIQUE o un FOREIGN KEY de SQLite reutiliza el mismo `id` que el find; cualquier otro error de SQLite (un CHECK, `no such table`) es `sqlite.unmapped`.

## Instalar y probar

Desde `domain/python/`:

### Windows PowerShell

```powershell
cd domain/python
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m unittest discover -s tests -v
```

### macOS/Linux

```sh
cd domain/python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
```

Las pruebas usan SQLite en memoria y cargan `sqlite/schema.sql`. PostgreSQL no tiene que estar en marcha. `query()` abre un `BEGIN` diferido; `with_transaction` usa `BEGIN IMMEDIATE` para las escrituras que comprueban y luego insertan. `find_session_exists` y `find_attendance_available` reciben esa `tx`. Una `query()` o un `with_transaction` que se llaman dentro de `with_transaction` usan la conexión de esa transacción en lugar de abrir otra. Una URL en memoria (`sqlite://`, `sqlite+pysqlite://`, `sqlite:///:memory:` o una URI con `mode=memory`) da una sola base compartida por todos los hilos, que la usan de uno en uno; es para pruebas. `update_session` y `update_attendance` hacen un UPDATE: si la fila no existe, devuelven `None`. Si al objeto de entrada le falta su clave (`{"session": …}`), el caso de uso lanza `ValidationError`. Borrar una sesión que aún tiene asistencias es `ConflictError`.

El analizador de tipos (basedpyright) usa este `.venv`. Si Cursor sigue marcando `sqlalchemy` como no resuelto, elige el intérprete `domain/python/.venv` o recarga la ventana.

Antes de un INSERT o UPDATE, el paquete comprueba las reglas. Si fallan, no escribe. El CHECK de SQLite se queda: solo acepta el ISO UTC con milisegundos, y en asistencia exige fichaje con `present` y `present_late` y lo prohíbe en `absent` y `notified_absence`. Un UNIQUE o un FOREIGN KEY de SQLite se traduce al mismo `id` de dominio. Cualquier otro error que lanza SQLite (un CHECK, `database is locked`, `no such table`) es `sqlite.unmapped`, con el error de SQLAlchemy como causa. Una `SQLITE_DATABASE_URL` que no se puede leer o que no es de SQLite es `ConfigurationError`. Un UUID o una fecha con un salto de línea al final no son válidos. `query` no forma parte de la API pública.

`start_at`, `end_at`, `closed_at` y `checked_in_at` entran con `Z` o un desfase y se guardan en ISO UTC (`2026-09-01T08:00:00.000Z`). Los UUID se guardan en minúsculas. `present` y `present_late` llevan `check_in_method` y `checked_in_at` dentro de la ventana de la sesión; `absent` y `notified_absence` van sin fichaje. No se comprueba la matrícula: `course_id` y `student_id` apuntan al core sin FK. `closed_at` solo va con el estado `closed`. Un remove de sesión borra las filas de `attendance` en la misma transacción. Un INSERT o UPDATE de sesión o asistencia lee la fila en el mismo `RETURNING`.

## Conexión

La conexión real usa `SQLITE_DATABASE_URL`. `check()` ejecuta `SELECT 1` y devuelve `{ "ok": True }`. El esquema vive en `sqlite/schema.sql`; este paquete no crea las tablas.
