# python-domain

SDK Python de aTempo. Paquete librería dentro de `domain/`, hermano de `node-domain/`. Tipos de `session` y `attendance`, lecturas, escrituras y reglas de SQLite operativo. No es un servicio HTTP.

El flujo de producto es Frontend → `api-sqlite` → `domain/python-domain` → SQLite. Este paquete abre la base. Flask no escribe SQL.

## Instalar y probar

Desde `domain/python-domain/`:

### Windows PowerShell

```powershell
cd domain/python-domain
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m unittest discover -s tests -v
```

### macOS/Linux

```sh
cd domain/python-domain
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
```

Las pruebas usan SQLite en memoria y cargan `sqlite/schema.sql`. PostgreSQL no tiene que estar en marcha. `query()` abre un `BEGIN` diferido; `with_transaction` usa `BEGIN IMMEDIATE` para las escrituras que comprueban y luego insertan.

El analizador de tipos (basedpyright) usa este `.venv`. Si Cursor sigue marcando `sqlalchemy` como no resuelto, elige el intérprete `domain/python-domain/.venv` o recarga la ventana.

Antes de un INSERT o UPDATE, el paquete comprueba las reglas. Si fallan, no escribe. El CHECK de SQLite se queda: solo acepta el ISO UTC con milisegundos, y en asistencia exige fichaje con `present` y `present_late` y lo prohíbe en `absent` y `notified_absence`.

`start_at`, `end_at`, `closed_at` y `checked_in_at` entran con `Z` o un desfase y se guardan en ISO UTC (`2026-09-01T08:00:00.000Z`). Los UUID se guardan en minúsculas. `present` y `present_late` llevan `check_in_method` y `checked_in_at` dentro de la ventana de la sesión; `absent` y `notified_absence` van sin fichaje. No se comprueba la matrícula: `course_id` y `student_id` apuntan al core sin FK. `closed_at` solo va con el estado `closed`. Un delete de sesión borra las filas de `attendance` en la misma transacción. Un INSERT o UPDATE de sesión o asistencia lee la fila en el mismo `RETURNING`.

## Conexión

La conexión real usa `SQLITE_DATABASE_URL`. `check()` ejecuta `SELECT 1`. El esquema vive en `sqlite/schema.sql`; este paquete no crea las tablas.
