# rustfs

SDK TypeScript de justificantes de aTempo. Paquete librería dentro de `domain/`. Guarda y lee objetos S3 en RustFS. No es un servicio HTTP.

El flujo de producto es Frontend → `api-rustfs` → `domain/rustfs` → RustFS. Este paquete abre el almacén. Express no importa este SDK todavía.

Las funciones públicas reciben y devuelven un objeto (RORO). El cliente S3, los comandos y los repositorios viven en `src/rustfs/`. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El SDK no exporta el `S3Client` ni borra objetos.

## Instalar y probar

Desde `domain/rustfs/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` sustituye el driver: RustFS no tiene que estar en marcha.

## Conexión

La conexión real ensambla el endpoint con `RUSTFS_ENDPOINT` (host), `RUSTFS_PORT`, `RUSTFS_USE_SSL`, `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`. Si falta alguna o está vacía, lanza `ConfigurationError`. `RUSTFS_USE_SSL` `true` o `1` usa HTTPS; el resto, HTTP. El `S3Client` usa `forcePathStyle: true` y `region: "us-east-1"`.

`check()` envía `HeadBucket` al bucket `justifications` y devuelve `{ ok: true }`.

El bucket es `justifications`. La clave es el `document_id` UUID en minúsculas, sin `courseId` ni `studentId` en la ruta. `content_type` MIME es obligatorio. Un put sobre una clave existente lanza `ConflictError` y no envía `PutObject`.
