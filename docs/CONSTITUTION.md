# Constitución de aTempo

Reglas básicas del proyecto. El detalle de producto sigue en [principles.md](../principles.md). Aquí solo queda lo que ya está decidido para construir.

## 1. Aplicación de escritorio

aTempo de escritorio es la aplicación del profesor. Sirve para registrar la asistencia de los alumnos de una clase.

## 2. Stack de `desktop/`

- **Electron** abre la ventana de escritorio.
- **React** pinta las pantallas.
- **Node** ejecuta el proceso principal de Electron.
- **Tailwind** pone los estilos con clases.
- **daisyUI** aporta los componentes (campo, botón, alert) encima de Tailwind.
- **TanStack Router** elige la pantalla según la ruta del hash.
- **Zustand** guarda el estado de la pantalla en el renderer.
- **SQLite** es la base local. Se abre con `node:sqlite` y la clase `DatabaseSync` en el proceso principal.
- **pnpm** es el gestor de paquetes de `desktop/`. Las versiones van fijas, sin `^`.

## 3. Stack de `data-access/`

`data-access/` es la SDK: carpeta en la raíz, hermana de `desktop/` y `api-postgresql/`. No hay carpeta `sdk/`. Dentro hay un paquete Python. No es un servicio HTTP: sin servidor, sin Swagger y sin Docker Compose.

### `data-access/python/`

- **Python** escribe el paquete.
- **SQLAlchemy Core 2.0.44** abre SQLite (`SQLITE_DATABASE_URL`).
- **Pydantic 2.14.4** define los contratos de `session` y `attendance` en `shared/types/`: modelos con `strict=True` y `frozen=True`. Cada campo valida con un `assert_*` de `shared/validation/` y lanza el error del catálogo.
- **atempo-errors** (`errors/python/`) da las clases de error y `create_error_factory`. Se enlaza como editable con `[tool.uv.sources]` y no se publica en PyPI.
- **uv 0.12.15** instala el paquete y fija las versiones en `uv.lock` (`uv sync --locked`).
- Las dependencias van fijadas en `data-access/python/pyproject.toml`.

Fija los tipos de `session` y `attendance`, las lecturas, las escrituras y las reglas que copia de SQLite: `end_at > start_at`, `status` `open`/`closing`/`closed`, `closed_at` solo en `closed`, estados de asistencia y `check_in_method`. `start_at`, `end_at`, `closed_at` y `checked_in_at` entran con `Z` o un desfase y se guardan en ISO UTC (`2026-09-01T08:00:00.000Z`). Los UUID se guardan en minúsculas. `present` y `present_late` llevan `check_in_method` y `checked_in_at` dentro de la sesión; `absent` y `notified_absence` van sin fichaje. No comprueba la matrícula: `course_id` y `student_id` son referencias lógicas al core, sin FK. Un delete de sesión quita en la misma transacción las filas de `attendance`. Si un objeto no cumple esos campos o reglas, o si la sesión no existe o la asistencia ya está, lanza y no escribe. `api-sqlite/` importará este paquete: Flask transforma HTTP, delega en `data-access/python/` y no escribe SQL.

## 4. Stack de `api-router/`

- **NestJS 11** expone REST y transforma las peticiones de los frontends.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-router/`. Las versiones van fijas, sin `^`.

El API-router no implementa reglas de negocio.

## 5. Stack de `api-postgresql/`

- **NestJS 11** expone la persistencia que usará la SDK para leer y escribir en PostgreSQL.
- **pg** abre la conexión y comprueba que la base responde.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-postgresql/`. Las versiones van fijas, sin `^`.

Este servicio no implementa reglas de negocio. El API-router no habla con PostgreSQL. El escritorio no llama a este servicio.

## 6. Stack de `api-rustfs/`

- **Express 5** expone REST hacia la SDK para persistencia de objetos en RustFS.
- **Cliente npm `minio` (API S3)** habla con RustFS.
- **swagger-ui-express** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-rustfs/`. Las versiones van fijas, sin `^`.

El API-router no accede a RustFS; la SDK consumirá este servicio cuando exista.

## 7. Stack de `api-sqlite/`

- **Flask** expone el servicio local de persistencia.
- **Pydantic** valida los modelos de entrada y salida.
- **SQLAlchemy Core** gestiona conexiones y consultas SQLite sin esquema de dominio.
- **Flasgger** sirve Swagger UI y OpenAPI para comprobar el servicio.
- **Python** ejecuta el paquete, que tiene sus dependencias fijadas en `api-sqlite/pyproject.toml`.

`api-sqlite/` delegará en `data-access/python/` las lecturas y escrituras. La SQLite de este servicio es independiente de `desktop/atempo.sqlite`.

## 8. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): capas del escritorio, flujo Frontend → `api-sqlite` → `data-access/python` → SQLite, y los almacenes.
- [TREE.md](TREE.md): árboles de `desktop/`, `data-access/python/`, `errors/python/`, `api-router/`, `api-postgresql/`, `api-rustfs/`, `api-sqlite/` y los almacenes.
