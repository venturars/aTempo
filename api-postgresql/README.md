# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Hoy expone `GET /health`, `GET /person`, `GET /person/:id`, `GET /person-role` y `GET /course` que lista la tabla `person` del esquema core (#32) cuando hay `DATABASE_URL`. Sin `DATABASE_URL`, el servicio usa un **mock de PostgreSQL** (`src/postgres/postgres-mock.ts`): health y person responden **200** con datos de prueba fijos. `POSTGRES_MOCK=1` fuerza el mock aunque exista `DATABASE_URL`. El escritorio no llama a este servicio.

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

## Probar con Swagger

1. Con `pnpm dev`, abre `http://localhost:3001/docs`.
2. **person** → `GET /person` → **Execute**: **200** con el mock o con filas reales de la tabla `person`.
   - **person** → `GET /person/{id}` → pega `3fa85f64-5717-4562-b3fc-2c963f66afa6` → **200** (mock). Otro UUID válido → **404**; un `id` que no es UUID → **400**; con Postgres real, la fila de `person` con ese `id` → **200**, sin fila → **404**, base caída → **503**.
3. **health** → `GET /health` → **Execute**: **200** en mock; con Postgres real, **503** si la base no responde.
4. **course** → `GET /course` → **Execute**: **200** con el mock o filas reales.
5. **person-role** → `GET /person-role` → **Execute**: **200** con el mock o filas reales.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm test` — e2e con mocks en el propio servicio y sustitución de `PostgresService` donde hace falta.