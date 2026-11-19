# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy expone `GET /health`, `GET /course` y `GET /person-role` (tablas del esquema #32 cuando hay `DATABASE_URL`). Sin `DATABASE_URL`, el servicio usa un **mock de PostgreSQL** (`src/postgres/postgres-mock.ts`): health, course y person-role responden **200** con datos de prueba fijos. `POSTGRES_MOCK=1` fuerza el mock aunque exista `DATABASE_URL`. El escritorio no llama a este servicio.

## Arranque

Desde `api-postgresql/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3001`. Puedes cambiarlo con `PORT`.

Modo mock (Swagger sin instalar Postgres): no definas `DATABASE_URL` o usa `POSTGRES_MOCK=1`.

Modo real:

```sh
# PowerShell
$env:DATABASE_URL = "postgres://usuario:clave@localhost:5432/atempo"
pnpm dev
```

```sh
# bash
DATABASE_URL=postgres://usuario:clave@localhost:5432/atempo pnpm dev
```

## Probar con Swagger

1. Con `pnpm dev`, abre `http://localhost:3001/docs`.
2. **course** → `GET /course` → **Execute**: **200** con el mock o filas reales.
3. **person-role** → `GET /person-role` → **Execute**: **200** con el mock o filas reales.
4. **health** → `GET /health` → **Execute**: **200** en mock; con Postgres real, **503** si la base no responde.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm test` — e2e con mocks en el propio servicio y sustitución de `PostgresService` donde hace falta.