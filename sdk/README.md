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
