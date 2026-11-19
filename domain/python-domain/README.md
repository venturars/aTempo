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

Las pruebas usan SQLite en memoria y cargan `sqlite/schema.sql`. PostgreSQL no tiene que estar en marcha.

El analizador de tipos (basedpyright) usa este `.venv`. Si Cursor sigue marcando `sqlalchemy` como no resuelto, elige el intérprete `domain/python-domain/.venv` o recarga la ventana.

Antes de un INSERT o UPDATE, el paquete comprueba las reglas. Si fallan, no escribe. El CHECK de SQLite se queda.

`start_at`, `end_at`, `closed_at` y `checked_in_at` entran con `Z` o un desfase. `closed_at` solo va con el estado `closed`. Un delete de sesión borra las filas de `attendance` en la misma transacción.

## Conexión

La conexión real usa `SQLITE_DATABASE_URL`. `check()` ejecuta `SELECT 1`. El esquema vive en `sqlite/schema.sql`; este paquete no crea las tablas.
