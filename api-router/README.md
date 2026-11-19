# api-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web), las adapta y las delegará en la **SDK (lógica de negocio)**. El router no implementa reglas de negocio.

Hoy solo expone `GET /health`. La lógica de negocio vivirá en [`sdk/`](../sdk/) (paquete hermano, carpeta pendiente); este servicio la consumirá cuando exista.

## Arranque

Desde `api-router/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3000`. Puedes usar la variable `PORT`.

## Docker Compose

Tras `docker compose run --rm setup`, el servicio ya forma parte del entorno Compose: desde la raíz, `docker compose up api-router` lo sirve en <http://localhost:3000>. `docker compose up api-router api-postgresql api-sqlite api-rustfs` inicia las cuatro APIs actuales; PostgreSQL y RustFS arrancan como dependencias de sus servicios. La base y los datos de persistencia permanecen en volúmenes separados.

Las pruebas y comprobaciones se ejecutan con el volumen Linux del paquete: `docker compose run --rm api-router pnpm test` (sustituye `test` por `typecheck`, `lint` o `build`).

## Probar con Swagger

1. Con el servicio en marcha (`pnpm dev`), abre `http://localhost:3000/docs` (o el mismo puerto que uses con `PORT`).
2. En la sección **health**, abre `GET /health` → **Try it out** → **Execute**.
3. La respuesta debe ser `200` con cuerpo `{ "status": "ok" }`.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-router/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm typecheck` — comprobación de tipos.
- `pnpm lint` — ESLint sobre `src/` y `test/`.
- `pnpm test` — prueba e2e de `/health` y Swagger.
- `pnpm build` — compilación a `dist/`.
