# api-minio

Servicio Express y TypeScript entre la **SDK (lógica de negocio)** y MinIO. La SDK (carpeta `sdk/`, pendiente) leerá y escribirá objetos a través de este servicio. El `api-router` no habla con MinIO.

Hoy solo expone `GET /health`, igual que `api-router/`: confirma que el servicio HTTP responde con `{ "status": "ok" }`. La configuración MinIO de abajo servirá cuando existan rutas de objetos.

## Variables de entorno

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `3003` | Puerto HTTP del servicio |
| `MINIO_ENDPOINT` | `127.0.0.1` | Host de MinIO |
| `MINIO_PORT` | `9000` | Puerto de MinIO |
| `MINIO_USE_SSL` | `false` | `true` o `1` para HTTPS |
| `MINIO_ACCESS_KEY` | `minioadmin` | Access key |
| `MINIO_SECRET_KEY` | `minioadmin` | Secret key |

## Arranque

Desde `api-minio/`:

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

Otros comandos, desde `api-minio/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```