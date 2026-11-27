# data-access

SDK de SQLite de aTempo. Carpeta en la raíz, hermana de `desktop/`, `sdk/` y `api-sqlite/`. `sdk/` une el API-router con las `api-xxx`; `data-access/` une las `api-xxx` con la base de datos. No es un servicio HTTP.

- [`sqlite/`](sqlite/README.md) — Python, `atempo-data-access-sqlite`. Abre SQLite (`session`, `attendance`). Lo usará `api-sqlite/`.
