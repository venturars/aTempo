# domain

SDK de aTempo. Carpeta en la raíz, hermana de `desktop/` y `api-postgresql/`. No hay carpeta `sdk/`. No es un servicio HTTP.

Dos paquetes, uno por lenguaje:

- [`node-domain/`](node-domain/README.md) — TypeScript. Abre PostgreSQL. Lo usará `api-postgresql/`.
- [`python-domain/`](python-domain/README.md) — Python. Abre SQLite (`session`, `attendance`). Lo usará `api-sqlite/`.
