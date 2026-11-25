# api-sqlite

Servicio Flask de persistencia local para SQLite. Importará `domain/python/` y delegará en ese paquete las lecturas y escrituras; hoy todavía no lo importa. `api-router/` no accede directamente a la base. Este servicio no usa ni sustituye `desktop/atempo.sqlite` y todavía no define tablas de dominio.

## Requisitos e instalación

Usa Python 3.11 o superior. Desde esta carpeta, crea un entorno virtual e instala el paquete editable:

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
```

### macOS/Linux

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
```

Las dependencias de Flask, Pydantic, SQLAlchemy Core y Flasgger están fijadas en `pyproject.toml`.

## Docker Compose

Desde la raíz, ejecuta `docker compose run --rm setup` para instalar el paquete en un entorno virtual Linux y luego `docker compose up api-sqlite`. El servicio queda en <http://localhost:3002>; dentro del contenedor escucha en `0.0.0.0`. El entorno virtual persiste en `api-sqlite-venv` y la base en `api-sqlite-data`. Esta base es independiente de la SQLite de Electron. Para ejecutar las pruebas dentro del contenedor: `docker compose run --rm api-sqlite /work/api-sqlite/.venv/bin/python -m unittest discover -s tests -v`.

## Arranque y configuración

Con el entorno activado:

```sh
python -m api_sqlite
```

El servidor local escucha en `127.0.0.1:3002`. Configura `PORT` para cambiar el puerto y `SQLITE_DATABASE_URL` para cambiar la URL de SQLAlchemy. El valor por defecto es `sqlite:///./api-sqlite.sqlite`, independiente de la base de Electron.

## Pruebas

Con el entorno virtual activado, ejecuta las pruebas estándar de Python desde `api-sqlite/`:

```sh
python -m unittest discover -s tests -v
```

La suite cubre health con SQLite, fallo de conexión, validación Pydantic antes del acceso a la base y Swagger/OpenAPI.

## Health y Swagger

`GET /health` ejecuta `SELECT 1` en SQLite y devuelve `200` con `{ "status": "ok" }` si la conexión funciona; si no, responde `503`. La petición habitual no lleva cuerpo. Si se envía un objeto JSON, Pydantic solo permite `{}`; cualquier campo extra devuelve `400` antes de acceder a SQLite. OpenAPI no declara un request body para este GET.

Con el servidor activo, abre <http://localhost:3002/docs> y ejecuta **health → GET /health → Try it out → Execute**. El esquema OpenAPI JSON está en <http://localhost:3002/docs-json>.
