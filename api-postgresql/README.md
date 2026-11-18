# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy solo expone `GET /health`, que confirma que PostgreSQL responde. No hay esquema de dominio. El escritorio no llama a este servicio.

## Arranque

### Docker Compose

Después de `docker compose run --rm setup`, desde la raíz del repositorio ejecuta `docker compose up api-postgresql` para iniciar esta API y PostgreSQL. Compose espera a que la base supere su healthcheck. La API queda en <http://localhost:3001>; el puerto 5432 de PostgreSQL no se publica en el host. `postgres-data` conserva los datos al recrear el contenedor.

La base usa el usuario `atempo` y requiere `ATEMPO_POSTGRES_PASSWORD` en el `.env` ignorado de la raíz. En Git Bash, genera una contraseña aleatoria hexadecimal de 64 caracteres y añádela con `printf 'ATEMPO_POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" >> .env`; ese formato es seguro en la URL de `DATABASE_URL`. CI crea una contraseña efímera. Estas credenciales son solo para desarrollo local.

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
```

Define la conexión y arranca. El ejemplo usa el puerto `5432` y la base `atempo`:

```sh
# PowerShell
$env:DATABASE_URL = "postgres://usuario:clave@localhost:5432/atempo"
pnpm dev
```

```sh
# bash
DATABASE_URL=postgres://usuario:clave@localhost:5432/atempo pnpm dev
```

Por defecto escucha en el puerto `3001`. Puedes cambiarlo con `PORT`.

## Probar con Swagger

1. Con el servicio en marcha (`pnpm dev`) y `DATABASE_URL` apuntando a un PostgreSQL que responda, abre `http://localhost:3001/docs` (o el mismo puerto que uses con `PORT`).
2. En la sección **health**, abre `GET /health` → **Try it out** → **Execute**.
3. Si la base responde, la respuesta es `200` con cuerpo `{ "status": "ok", "postgres": "ok" }`.
4. Si falta `DATABASE_URL` o PostgreSQL no responde, la respuesta es `503` con cuerpo `{ "status": "error", "postgres": "error" }`.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm typecheck` — comprobación de tipos.
- `pnpm lint` — ESLint sobre `src/` y `test/`.
- `pnpm test` — prueba e2e de `/health` (200 y 503) y de Swagger. No necesita PostgreSQL: sustituye el servicio de conexión.
- `pnpm build` — compilación a `dist/`.
