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

`data-access/` es la SDK de PostgreSQL: carpeta en la raíz, hermana de `desktop/`, `sdk/` y `api-postgresql/`. Dentro hay un paquete TypeScript. No es un servicio HTTP: sin servidor, sin Swagger y sin Docker Compose.

### `data-access/node/`

- **TypeScript** escribe el paquete.
- **pg 8.23.1** abre PostgreSQL (`DATABASE_URL`, timeout 3 s).
- **@atempo/errors** (`errors/` en la raíz) da las clases de error y `createErrorFactory`. Se enlaza con `link:../../errors` y no se publica en npm.
- **pnpm** es el gestor de paquetes. Las versiones van fijas, sin `^`.

Fija los tipos del core (`organization`, `person`, `course`, `person_course`, `role`, `person_role`), las lecturas, las escrituras y las reglas que copia de PostgreSQL: `end_at > start_at`, `contract_address` `0x`+40 hex, student exclusivo y unicidades. El email se guarda recortado y en minúsculas, igual que `normalizeEmail` del escritorio. `contract_address` se guarda en hex minúsculas. `start_at` y `end_at` entran con `Z` o un desfase (`+01:00`) y salen en ISO UTC; `birth_date` en `YYYY-MM-DD`. Un delete quita en la misma transacción las filas hijas (`person_role`, `person_course`, cursos de la organización): o se borra todo o no se borra nada. `role` no se escribe. Si un objeto no cumple esos campos o reglas, o si una matrícula, un rol o un id no existen o ya están, lanza y no escribe en PostgreSQL.

## 4. Stack de `api-router/`

- **NestJS 11** expone REST y transforma las peticiones de los frontends.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-router/`. Las versiones van fijas, sin `^`.

La SDK de lógica de negocio es el paquete `atempo-sdk` en `sdk/`, al mismo nivel que `desktop/` y `api-router/`. Capas: shared (`Result`, `AppError`), dominio, aplicación, infraestructura mock y composición. Expone `afterAuth({ email })`: el health de `api-postgresql` se inyecta (`fetch`); si no hay persona en el mock, el resultado es ok y no crea. Auth0 permanece en `AuthService`. Tras login, register o `me` correctos, el router llama a `afterAuth`. `GET /auth/me` sigue `{ email }` (Bearer) o `{ email, profile }` (cookie). 503 `POSTGRES_API_UNAVAILABLE` solo si `afterAuth` falla con `CONFIGURATION` o `PERSISTENCE`; `VALIDATION` → 400. El CRUD HTTP de organización y personas sale de módulos Nest `organization/` y `person/` (controller → service → SDK). Cursos y matrículas (`course/`) siguen el mismo patrón en memoria. No hay GET del Resumen. El API-router no implementa reglas de negocio; las delega en esta SDK.

## 5. Stack de `api-postgresql/`

- **NestJS 11** expone REST hacia PostgreSQL.
- **pg** abre hoy la conexión en `PostgresService`, hasta que el servicio importe `data-access/node`.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-postgresql/`. Las versiones van fijas, sin `^`.

El flujo de producto previsto es Frontend → `api-postgresql` → `data-access/node` → PostgreSQL. Nest transforma HTTP y delega en `data-access/node`. Ese paquete abre la base. Nest no escribe SQL. Hoy el escritorio todavía no llama a este servicio: su login y la pestaña Hoy van al `api-router`.

## 6. Stack de `api-rustfs/`

- **Express 5** expone REST hacia `data-access/node/` para persistencia de objetos en RustFS.
- **Cliente npm `minio` (API S3)** habla con RustFS.
- **swagger-ui-express** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-rustfs/`. Las versiones van fijas, sin `^`.

El API-router no accede a RustFS; `data-access/node/` lo consumirá cuando exista esa persistencia.

## 7. Stack de `api-sqlite/`

- **Flask** expone el servicio local de persistencia.
- **Pydantic** valida los modelos de entrada y salida.
- **SQLAlchemy Core** gestiona conexiones y consultas SQLite sin esquema de dominio.
- **Flasgger** sirve Swagger UI y OpenAPI para comprobar el servicio.
- **Python** ejecuta el paquete, que tiene sus dependencias fijadas en `api-sqlite/pyproject.toml`.

`api-sqlite/` es el servicio de persistencia local. La SQLite de este servicio es independiente de `desktop/atempo.sqlite`.

## 8. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): capas del escritorio, flujo de `api-router/` y `sdk/`, flujo previsto Frontend → `api-postgresql` → `data-access/node` → PostgreSQL, las APIs de persistencia y los almacenes.
- [TREE.md](TREE.md): árboles de `desktop/`, `api-router/`, `sdk/`, `data-access/node/`, `errors/`, `api-postgresql/`, `api-rustfs/`, `api-sqlite/` y los almacenes.
