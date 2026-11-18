# api-postgresql

Servicio de persistencia con NestJS y TypeScript. La SDK de lógica de negocio hablará con este servicio para leer y escribir en PostgreSQL. El API-router no habla con la base.

Expone `GET /health`, que confirma que PostgreSQL responde, y `GET /person-course`, que lista las asociaciones de personas y cursos. El escritorio no llama a este servicio.

## Arranque

Para usar la base real hace falta un PostgreSQL que ya esté en marcha. Este paquete no lo levanta. Sin `DATABASE_URL`, o con `POSTGRES_MOCK=1`, el endpoint `GET /person-course` devuelve datos fijos para desarrollo y Swagger.

Desde `api-postgresql/`:

```sh
pnpm install
```

Define la conexión y arranca. El ejemplo usa el puerto `5432` y la base `atempo`:

```sh
# PowerShell
$env:DATABASE_URL = "postgres://usuario:clave@localhost:5432/atempo"
pnpm dev
```

```sh
# bash
DATABASE_URL=postgres://usuario:clave@localhost:5432/atempo pnpm dev
```

Por defecto escucha en el puerto `3001`. Puedes cambiarlo con `PORT`.

## Probar con Swagger

1. Arranca el servicio con `pnpm dev` y abre `http://localhost:3001/docs` (o el puerto configurado con `PORT`).
2. En la sección **person-course**, ejecuta `GET /person-course`.
3. Sin `DATABASE_URL`, el endpoint responde `200` con un array fijo de ejemplo. También puedes forzar ese modo con `POSTGRES_MOCK=1`, incluso si `DATABASE_URL` está definida.
4. Para leer la base real, define `DATABASE_URL`, asegúrate de que PostgreSQL tiene la tabla `person_course` y quita `POSTGRES_MOCK`. El endpoint ejecuta `SELECT person_id, course_id FROM person_course` y responde `200` con todas las filas; si no hay filas, devuelve `[]`.
5. Si la conexión o la consulta falla en modo real, `GET /person-course` responde `503`. `GET /health` también responde `503` si falta `DATABASE_URL` o PostgreSQL no responde.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-postgresql/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm typecheck` — comprobación de tipos.
- `pnpm lint` — ESLint sobre `src/` y `test/`.
- `pnpm test` — pruebas e2e de `/health`, `/person-course` y Swagger. No necesita PostgreSQL: los tests sustituyen el servicio de conexión.
- `pnpm build` — compilación a `dist/`.
