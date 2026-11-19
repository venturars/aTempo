# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy expone `GET /health`, `GET /course` y `GET /person-role` (tablas del esquema #32 cuando hay `DATABASE_URL`). Sin `DATABASE_URL`, el servicio usa un **mock de PostgreSQL** (`src/postgres/postgres-mock.ts`): health, course y person-role responden **200** con datos de prueba fijos. `POSTGRES_MOCK=1` fuerza el mock aunque exista `DATABASE_URL`. El escritorio no llama a este servicio.

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

```sh
# bash
DATABASE_URL=postgres://usuario:clave@localhost:5432/atempo pnpm dev
```

## Probar con Swagger

1. Con `pnpm dev`, abre `http://localhost:3001/docs`.
2. **course** → `GET /course` → **Execute**: **200** con el mock o filas reales.
3. **person-role** → `GET /person-role` → **Execute**: **200** con el mock o filas reales.
4. **health** → `GET /health` → **Execute**: **200** en mock; con Postgres real, **503** si la base no responde.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm test` — e2e con mocks en el propio servicio y sustitución de `PostgresService` donde hace falta.