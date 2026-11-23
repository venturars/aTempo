# sdk

Paquete de lógica de negocio de aTempo (`atempo-sdk`). Vive al mismo nivel que `desktop/` y `api-router/`. No es un servicio HTTP.

El flujo es desktop → api-router → Auth0 → SDK → api-postgresql. Auth0 se queda en el router. Tras un login o `me` correcto, el router llama a `afterAuth({ email })`. La SDK identifica por email (recortado, en minúsculas) y pide `GET /health` a `api-postgresql`.

## Arranque

Desde `sdk/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` sustituye `fetch`. PostgreSQL y `api-postgresql` no tienen que estar en marcha.

## Configuración

`API_POSTGRESQL_URL` es la base de `api-postgresql` (en Compose, `http://api-postgresql:3001`). Si falta, `afterAuth` lanza un error de configuración.

## Comprobar la red de verdad

Con `api-router` y `api-postgresql` en marcha (`docker compose up api-router api-postgresql`):

```sh
docker compose exec api-router node /work/sdk/scripts/check-live-health.cjs
```

Eso llama a `afterAuth` dentro del contenedor del router y espera `GET /health` ok en `api-postgresql`. No usa Auth0.

Para el login completo (Auth0 y después el health), con las variables de cuenta en el entorno:

```sh
ATEMPO_LIVE_EMAIL=… ATEMPO_LIVE_PASSWORD=… API_ROUTER_URL=http://127.0.0.1:3000 node sdk/scripts/check-live-login.cjs
```
