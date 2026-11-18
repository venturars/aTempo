# api-rustfs

Servicio Express y TypeScript entre la **SDK (lógica de negocio)** y **RustFS** (almacén de objetos compatible con S3). La SDK (carpeta `sdk/`, pendiente) leerá y escribirá objetos a través de este servicio. El `api-router` no habla con RustFS.

Hoy solo expone `GET /health`, igual que `api-router/`: confirma que el servicio HTTP responde con `{ "status": "ok" }`. La configuración RustFS de abajo servirá cuando existan rutas de objetos. El cliente npm `minio` habla con RustFS por su API S3.

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