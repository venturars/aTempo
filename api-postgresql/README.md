# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Expone `GET /health`, los listados `GET /person`, `GET /course`, `GET /organization`, `GET /person-role` y `GET /person-course`, `GET /person/:id`, `POST /person-course` y `DELETE /person-course/:personId/:courseId`. Con `DATABASE_URL`, cada listado consulta su tabla del esquema core (#32), `GET /person/:id` devuelve una fila por UUID, el POST inserta una matrícula y el DELETE borra una fila de `person_course`. Sin `DATABASE_URL`, el servicio usa un **mock de PostgreSQL** (`src/postgres/postgres-mock.ts`) y responde **200** con datos de prueba fijos (el DELETE de la pareja mock responde **204**). `POSTGRES_MOCK=1` fuerza el mock aunque exista `DATABASE_URL`. El escritorio no llama a este servicio.

## Arranque

### Docker Compose

Después de `docker compose run --rm setup`, desde la raíz del repositorio ejecuta `docker compose up api-postgresql` para iniciar esta API y PostgreSQL. Compose espera a que la base supere su healthcheck. La API queda en <http://localhost:3001>; PostgreSQL se publica en `localhost:5433` y la API se conecta por `postgres:5432` dentro de Compose. El volumen compartido `postgres-data` conserva los datos al recrear contenedores. PostgreSQL usa la versión 17.12; no montes directamente en ella un volumen de PostgreSQL 16. Haz una copia de seguridad y una migración explícita antes de cambiar de versión.

La base usa el usuario `atempo` y requiere `ATEMPO_POSTGRES_PASSWORD` en el `.env` ignorado de la raíz; `POSTGRES_PASSWORD` sirve como alternativa. En Git Bash, genera una contraseña aleatoria hexadecimal de 64 caracteres y añádela con `printf 'ATEMPO_POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" >> .env`; ese formato es seguro en la URL de `DATABASE_URL`. CI crea una contraseña efímera. Estas credenciales son solo para desarrollo local.

Al reutilizar un volumen PostgreSQL 17 creado antes de añadir el esquema operativo, comprueba primero las tablas de la base configurada:

```powershell
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

`postgres/init/01_schema.sql` se ejecuta automáticamente solo al crear un volumen vacío; montarlo después no aplica el esquema. Si no hay tablas de aplicación ni datos que preservar, haz antes una copia de seguridad y aplica el esquema una sola vez, dentro de una transacción:

```powershell
Get-Content -Raw -Encoding UTF8 postgres/init/01_schema.sql | docker compose exec -T postgres sh -c 'psql --single-transaction -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Si ya hay tablas o datos, no vuelvas a aplicar el script ni borres el volumen: requiere una migración explícita.

Las pruebas y comprobaciones se ejecutan con las dependencias Linux del volumen Docker:

```sh
docker compose run --rm api-postgresql pnpm typecheck
docker compose run --rm api-postgresql pnpm lint
docker compose run --rm api-postgresql pnpm test
docker compose run --rm api-postgresql pnpm build
```

### Arranque local

Desde `api-postgresql/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3001`. Puedes cambiarlo con `PORT`.

Modo mock (Swagger sin instalar Postgres): no definas `DATABASE_URL` o usa `POSTGRES_MOCK=1`.

Modo real:

```sh
# PowerShell
$env:DATABASE_URL = "postgres://usuario:clave@localhost:5432/atempo"
pnpm dev
```

## Probar con Swagger

1. Con `pnpm dev`, abre `http://localhost:3001/docs`.
2. **person** → `GET /person` → **Execute**: **200** con el mock o con filas reales de la tabla `person`.
   - **person** → `GET /person/{id}` → pega `3fa85f64-5717-4562-b3fc-2c963f66afa6` → **200** (mock). Otro UUID válido → **404**; un `id` que no es UUID → **400**; con Postgres real, la fila de `person` con ese `id` → **200**, sin fila → **404**, base caída → **503**.
3. **health** → `GET /health` → **Execute**: **200** en mock; con Postgres real, **503** si la base no responde.
4. **course** → `GET /course` → **Execute**: **200** con el mock o filas reales.
5. **organization** → `GET /organization` → **Execute**: **200** con el mock o todas las filas reales de `organization` (`id`, `name` y `tax_id`). Con la tabla vacía devuelve `[]`; si la consulta real falla, **503**.
6. **person-role** → `GET /person-role` → **Execute**: **200** con el mock o filas reales.
7. **person-course** → `GET /person-course` → **Execute**: **200** con el array fijo de ejemplo o con todas las filas de `person_course` (`person_id` y `course_id`). Con la tabla vacía devuelve `[]`; si la consulta real falla, **503**.
   - **person-course** → `POST /person-course` → cuerpo `{ "person_id", "course_id" }`. En mock, una pareja distinta a la de ejemplo → **201**; la pareja mock → **409**; UUID mal formado o cuerpo vacío → **400**. Con Postgres real, persona y curso existentes y pareja nueva → **201**; la misma pareja otra vez → **409**; un id que no está en `person` o `course` → **404**; si la base no responde → **503**. El POST no crea persona ni curso.
   - **person-course** → `DELETE /person-course/{personId}/{courseId}` → pega `3fa85f64-5717-4562-b3fc-2c963f66afa6` y `7c9e6679-7425-40de-944b-e07fc1f90ae7` → **204** (mock). Otra pareja de UUID válidos → **404**; un param que no es UUID → **400**. Con Postgres real, si existe la fila → **204** y esa pareja ya no aparece en `GET /person-course`; si no existe → **404**; si la base no responde → **503**. `person` y `course` no se borran.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm test` — e2e de los listados, `POST /person-course`, `DELETE /person-course` y Swagger con mocks en el propio servicio y sustitución de `PostgresService` donde hace falta; no requiere PostgreSQL. El mock no persiste: un POST **201** no añade filas al GET y un DELETE **204** no las quita. Con Postgres real, comprueba el paso 3 de la issue #151.
