# data-access

SDK de PostgreSQL de aTempo. Carpeta en la raíz, hermana de `desktop/`, `sdk/` y `api-postgresql/`. No es un servicio HTTP.

- [`node/`](node/README.md) — TypeScript. Abre PostgreSQL. Lo usará `api-postgresql/`.

Las clases de error y la fábrica `createErrorFactory` viven en `errors/node/`. Es el paquete local `@atempo/errors` y no conoce aTempo: recibe el catálogo de labels, reasons y mensajes y devuelve `domainError` y `fail`. `node/` lo enlaza con `"@atempo/errors": "link:../../errors/node"`. No se publica en el registro de npm.
