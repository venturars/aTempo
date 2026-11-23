# api-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web), las adapta, autentica con Auth0 y delega en la **SDK (lógica de negocio)**. El router no implementa reglas de negocio.

Expone `GET /health`, `POST /auth/login` y `GET /auth/me`. El login solicita a Auth0 un Access Token; `/auth/me` valida el Bearer recibido. Tras un login o `me` correcto, llama a [`sdk/`](../sdk/) con el email; la SDK pide `GET /health` a `api-postgresql`.

## Arranque

Desde `api-router/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3000`. Puedes usar la variable `PORT`.

## Auth0

Configura `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` y `AUTH0_AUDIENCE` en el `.env` local de la raíz antes de iniciar Compose. `AUTH0_DOMAIN` es el dominio HTTPS del tenant y `AUTH0_AUDIENCE` es el API Identifier configurado en Auth0. Compose pasa estas variables y `API_POSTGRESQL_URL` al servicio `api-router`; el secreto no entra en Electron ni se versiona. La Application debe tener Password Grant y acceso a la conexión de usuarios. Las cuentas de prueba ya están creadas; comprueba que la conexión permite su login.

`POST /auth/login` recibe `{ "email": "...", "password": "..." }` y responde `{ "accessToken": "...", "expiresIn": 3600 }` cuando Auth0 incluye la duración. Credenciales rechazadas devuelven `401` con código `INVALID_CREDENTIALS`. Si Auth0 va bien y `api-postgresql` no responde al health, el código es `POSTGRES_API_UNAVAILABLE`. `GET /auth/me` requiere `Authorization: Bearer <accessToken>` con claim `email` y devuelve `{ "sub": "..." }` si el token es válido. `/health` y `/docs` son públicos.

## Docker Compose

Tras `docker compose run --rm setup`, el servicio ya forma parte del entorno Compose: desde la raíz, `docker compose up api-router` lo sirve en <http://localhost:3000>. `docker compose up api-router api-postgresql api-sqlite api-rustfs` inicia las cuatro APIs actuales; PostgreSQL y RustFS arrancan como dependencias de sus servicios. La base y los datos de persistencia permanecen en volúmenes separados.

Las pruebas y comprobaciones se ejecutan con el volumen Linux del paquete: `docker compose run --rm api-router pnpm test` (sustituye `test` por `typecheck`, `lint` o `build`).

Con `api-postgresql` en marcha, `docker compose exec api-router node /work/sdk/scripts/check-live-health.cjs` comprueba que la SDK llega a `GET /health` por la red de Compose. Si acabas de añadir `atempo-sdk`, ejecuta `pnpm install` en el contenedor del router y reinícialo. El login completo (Auth0 y el health) se lanza con `sdk/scripts/check-live-login.cjs`.

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
