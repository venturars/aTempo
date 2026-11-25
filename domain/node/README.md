# node

SDK TypeScript de aTempo. Paquete librería dentro de `domain/`. Tipos del core, lecturas, escrituras y reglas de PostgreSQL. No es un servicio HTTP. `role` es tabla semilla: no se escribe.

El flujo de producto es Frontend → `api-postgresql` → `domain/node` → PostgreSQL. Este paquete abre la base. Nest no escribe SQL.

Las funciones públicas reciben y devuelven un objeto (RORO). Las queries viven en `src/postgres/queries/`. El pool y los ejecutores viven en `src/postgres/`. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El campo `id` identifica el caso (`person.email.taken`, `course.end_at.order`). El campo `type` es VALIDATION, NOT_FOUND, CONFLICT, CONFIGURATION o PERSISTENCE. Se busca en `src/errors/catalog.ts`. El paquete lanza con `fail(label, reason)`. Un valor que no es string da `string` (`course.name.string`); un string vacío donde no se admite da `empty`. Las filas de course y person que se leen de PostgreSQL pasan por `courseFromRow` y `personFromRow`, que solo comprueban la forma: un valor guardado que la entrada no aceptaría no rompe el listado. Un `23505` o `23503` de `pg` reutiliza el mismo `id` que el find. Un `23503` en un DELETE (el padre todavía tiene hijos) es `ConflictError` con `referenced`, por ejemplo `person.referenced`. El `P0001` del trigger `person_role_student_is_exclusive` es `person_role.student.exclusive`. Cualquier otro error de PostgreSQL, también no poder conectar, es `postgres.unmapped`.

## Instalar y probar

Desde `domain/node/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` sustituye el driver: PostgreSQL no tiene que estar en marcha. Los tests cubren `DATABASE_URL` ausente, ping ok, ping fallido, `find*` que lanza sin llamar al driver, listar u obtener una fila, listar por relación (`retrieveAllXByY`), add/update/remove, un remove que hace ROLLBACK a mitad, y las reglas (`end_at`, `contract_address`, student exclusivo, unicidades, matrícula o rol repetidos, ids que no existen, `birth_date` inválida).

Antes de un INSERT o UPDATE, `domain/node/` comprueba esas reglas. Si fallan, no escribe. El CHECK y el trigger de PostgreSQL se quedan. Un `23505` o `23503` de `pg` se traduce al mismo `id` de dominio. `addPersonCourse` mira persona, curso y matrícula en una sola consulta, dentro de la transacción del INSERT.

El email se recorta y pasa a minúsculas, igual que el login del escritorio. `contract_address` se guarda en hex minúsculas: `0xABC…` y `0xabc…` son la misma dirección. `start_at` y `end_at` entran con `Z` o un desfase (`+01:00`) y salen como ISO UTC (`2026-09-01T08:00:00.000Z`). Una hora sin zona (`2026-09-01T08:00`) se rechaza. `birth_date` sale como `YYYY-MM-DD`. Un remove de persona, curso u organización borra las filas hijas (`person_role`, `person_course` y, en organización, también sus cursos) en `BEGIN` / `COMMIT` sobre un mismo cliente del pool. Si el último DELETE falla, hay `ROLLBACK`. Borrar una organización quita todos sus cursos y matrículas. El esquema no usa `ON DELETE CASCADE`.

## Conexión

La conexión real usa `DATABASE_URL` (timeout 3 s). `check()` ejecuta `SELECT 1` y devuelve `{ ok: true }`. Si una conexión se rompe (PostgreSQL se reinicia o se corta la red), el error se escribe con `console.error` y el proceso sigue. Si estaba esperando en el pool, pg la descarta y la siguiente query abre otra. Si estaba dentro de una transacción, la transacción falla y la conexión se destruye. Si en una transacción falla también el `ROLLBACK`, la conexión se destruye con `release(error)` en lugar de volver al pool.
