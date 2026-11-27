# api-rustfs

Servicio Express y TypeScript entre `data-access/postgres/` y **RustFS** (almacén de objetos compatible con S3). `data-access/postgres/` leerá y escribirá objetos a través de este servicio. El `api-router` no habla con RustFS.

Hoy solo expone `GET /health`, igual que `api-router/`: confirma que el servicio HTTP responde con `{ "status": "ok" }`. No hay rutas de objetos todavía. El cliente npm `minio` y `checkRustfsWithDefaultClient` permiten comprobar por separado la conexión S3 con RustFS; esa comprobación no cambia la respuesta de `/health`.

## Docker Compose

Después de `docker compose run --rm setup`, desde la raíz ejecuta `docker compose up api-rustfs` para iniciar la API y RustFS. La API queda en <http://localhost:3003>; RustFS publica S3 en `localhost:9000` y la consola en `localhost:9001`. Dentro de Compose, la API se conecta a `rustfs:9000`. El volumen compartido `rustfs-data` conserva los objetos al recrear servicios.

Compose usa `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`, compartidas por la API y RustFS. Si no se definen, el entorno de desarrollo usa `atempo` y `atempoatempo`; cámbialas en `.env` antes de exponer los puertos a una red. `/health` conserva su contrato y verifica únicamente HTTP; la conectividad S3 se prueba aparte con `checkRustfsWithDefaultClient` en la validación Docker.

Ejecuta `docker compose run --rm api-rustfs pnpm test`; cambia `test` por `typecheck`, `lint` o `build` para las otras comprobaciones.

## Variables de entorno

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `3003` | Puerto HTTP del servicio |
| `RUSTFS_ENDPOINT` | `127.0.0.1` | Host de RustFS (API S3) |
| `RUSTFS_PORT` | `9000` | Puerto de RustFS |
| `RUSTFS_USE_SSL` | `false` | `true` o `1` para HTTPS |
| `RUSTFS_ACCESS_KEY` | `rustfsadmin` | Access key |
| `RUSTFS_SECRET_KEY` | `rustfsadmin` | Secret key |

En RustFS también existe `RUSTFS_ADDRESS` en el servidor; aquí se reparte en endpoint y puerto para el cliente.

## Arranque

Desde `api-rustfs/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3003`. Puedes usar `PORT`.

## Probar con Swagger

1. Con el servicio en marcha (`pnpm dev`), abre `http://localhost:3003/docs/`.
2. En la sección **health**, abre `GET /health` → **Try it out** → **Execute**.
3. La respuesta debe ser `200` con `{ "status": "ok" }`.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-rustfs/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
