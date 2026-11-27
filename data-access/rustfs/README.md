# rustfs

SDK TypeScript de justificantes de aTempo. Paquete librería dentro de `data-access/`. Guarda y lee objetos S3 en RustFS. No es un servicio HTTP.

El flujo de producto es Frontend → `api-rustfs` → `data-access/rustfs` → RustFS. Este paquete abre el almacén. Express no importa este SDK todavía.

Las funciones públicas reciben y devuelven un objeto (RORO). El cliente S3, los comandos y el almacén viven en `src/rustfs/`. `src/shared/types/` solo tiene tipos: `interface` para `Justification` y `JustificationCreate`. Los `assert*` y `normalizeUuid` viven en `src/shared/validation/`: `assert.ts` con los genéricos y `justification.ts` con los de la entidad. `test/structure.spec.ts` comprueba que `shared/types` no exporta valores y que la API pública no cambia. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El campo `id` identifica el caso (`justification.document_id.taken`, `rustfs.unmapped`) y `kind` la familia (VALIDATION, NOT_FOUND, CONFLICT, CONFIGURATION o PERSISTENCE). Se busca en el catálogo de `src/shared/errors.ts`. Las clases vienen de `@atempo/errors` (`errors/node/`), y `src/shared/errors.ts` crea `buildError` y `fail` con su `createErrorFactory`. El paquete lanza con `fail(label, reason)`. El SDK no exporta el `S3Client` ni borra objetos.

## Instalar y probar

Desde `data-access/rustfs/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` sustituye el driver: RustFS no tiene que estar en marcha.

## Conexión

La conexión real ensambla el endpoint con `RUSTFS_ENDPOINT` (host), `RUSTFS_PORT`, `RUSTFS_USE_SSL`, `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`. Si falta alguna o está vacía, lanza `ConfigurationError` con `rustfs.RUSTFS_ENDPOINT.missing_env` (o la variable que falte). `RUSTFS_ENDPOINT` es solo el host (`rustfs`, `127.0.0.1`), igual que en `api-rustfs` y `docker-compose.yml`: un valor con esquema o puerto, como el `http://127.0.0.1:9000` de `rustfs/.env.example`, lanza `ConfigurationError`. `RUSTFS_PORT` tiene que ser un número de 1 a 65535. `RUSTFS_USE_SSL` `true` o `1` usa HTTPS y `false` o `0`, HTTP, sin distinguir mayúsculas. Otro valor lanza `ConfigurationError`. El `S3Client` usa `forcePathStyle: true` y `region: "us-east-1"`.

`check()` envía `HeadBucket` al bucket `justifications` y devuelve `{ ok: true }`.

El bucket es `justifications`. La clave es el `document_id` UUID en minúsculas, sin `courseId` ni `studentId` en la ruta. `content_type` MIME es obligatorio. Un put es un solo `PutObject` con `IfNoneMatch: '*'`: RustFS no sobrescribe una clave que ya existe y responde 412, que el paquete lanza como `ConflictError` con `justification.document_id.taken`. Un 409 `ConditionalRequestConflict` (otra escritura sobre la misma clave en curso) es `PersistenceError`, porque esa otra escritura puede fallar; quien llama puede reintentar. Si falta el bucket, `NoSuchBucket` es `PersistenceError`. RustFS respeta `IfNoneMatch` desde la 1.0.0-alpha.47; Compose usa la 1.0.3. En `justificationExists`, un `HeadObject` no tiene cuerpo y S3 da el mismo 404 `NotFound` si falta la clave o el bucket: el paquete envía entonces `HeadBucket`, y solo si este da 404 lanza `PersistenceError`; un 403 (credenciales que solo ven objetos) deja `{ exists: false }`. En `HeadObject`, un 404 sin nombre de S3 es `PersistenceError`. En `GetObject`, cualquier 404 que no sea `NoSuchBucket` es `{ justification: null }`. Un objeto sin `Content-Type` (subido por otra herramienta) se lee con `content_type: 'application/octet-stream'`.
