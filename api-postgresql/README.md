# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy expone `GET /health`, que comprueba PostgreSQL cuando hay `DATABASE_URL`, y `GET /person`, que devuelve **datos de prueba fijos** en JSON (forma del modelo `person` de #32; no consulta la base en este paso). El escritorio no llama a este servicio.

## Arranque

Desde `api-postgresql/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3001`. Puedes cambiarlo con `PORT`.

`GET /person` no requiere PostgreSQL. Para probar `GET /health` con **200**, define `DATABASE_URL` y ten un PostgreSQL en marcha:

```sh
# PowerShell
$env:DATABASE_URL = "postgres://usuario:clave@localhost:5432/atempo"
pnpm dev
```

## Probar con Swagger

1. Con `pnpm dev`, abre `http://localhost:3001/docs` (o el mismo puerto que uses con `PORT`).
2. En **person**, `GET /person` → **Try it out** → **Execute** → **200** con el array de datos de prueba (misma forma que en la issue #131).
3. En **health**, `GET /health` → **Execute**. Con `DATABASE_URL` y Postgres accesible: **200** `{ "status": "ok", "postgres": "ok" }`. Sin conexión: **503**.

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
- `pnpm test` — e2e de `/health`, `/person` y Swagger. No necesita PostgreSQL: sustituye el servicio de conexión de health.
- `pnpm build` — compilación a `dist/`.