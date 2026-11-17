# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy solo expone `GET /health`, que confirma que PostgreSQL responde. No hay esquema de dominio. El escritorio no llama a este servicio.

## Arranque

Hace falta un PostgreSQL que ya esté en marcha. Este paquete no lo levanta.

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
