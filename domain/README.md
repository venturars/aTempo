# domain

SDK de aTempo. Paquete librería en la raíz, hermano de `desktop/` y `api-postgresql/`. Tipos del core y lecturas de PostgreSQL. No es un servicio HTTP.

El flujo de producto es Frontend → `api-postgresql` → `domain` → PostgreSQL. Este paquete abre la base. Nest no escribe SQL.

## Instalar y probar

Desde `domain/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` sustituye el driver: PostgreSQL no tiene que estar en marcha. Los tests cubren `DATABASE_URL` ausente, ping ok, ping fallido, `assert*` que lanza sin llamar al driver, y listar u obtener una fila.

## Conexión

La conexión real usa `DATABASE_URL` (timeout 3 s). `check()` ejecuta `SELECT 1`.
