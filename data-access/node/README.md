# node

SDK TypeScript de aTempo. Paquete librería dentro de `data-access/`. Tipos del core, lecturas, escrituras y reglas de PostgreSQL. No es un servicio HTTP. `role` es tabla semilla: no se escribe.

El flujo de producto es Frontend → `api-postgresql` → `data-access/node` → PostgreSQL. Este paquete abre la base. Nest no escribe SQL.

El código se agrupa por funcionalidad, no por tabla:

| Módulo | Qué hace |
| --- | --- |
| `src/organizations/` | `registerOrganization`, `modifyOrganization`, `removeOrganization`, `retrieveOrganizationById`, `retrieveAllOrganizations` |
| `src/people/` | `addPerson`, `modifyPerson`, `removePerson`, `retrievePersonById`, `retrieveAllPersons` |
| `src/roles/` | `assignRole`, `revokeRole`, `changeRole`, `retrieveAllRoles`, `retrieveAllRolesByPerson`, `retrieveAllPersonsByRole` |
| `src/courses/` | `addCourse`, `modifyCourse`, `removeCourse`, `retrieveCourseById`, `retrieveAllCourses`, `retrieveAllCoursesByOrganization` |
| `src/enrollment/` | `enrollPerson`, `unenrollPerson`, `retrieveAllPersonsByCourse`, `retrieveAllCoursesByPerson` |

Cada módulo tiene un `rules.ts` con las comprobaciones `ensure*` (existe, está libre, se puede cambiar). Lanzan si la regla falla y no se exportan.

`modify*` recibe `{ id, changes }` y cambia solo los campos que vienen en `changes`. Lee la fila en una transacción, mezcla los cambios y valida el objeto completo: si solo cambia `end_at`, se compara con el `start_at` guardado. Un `changes` vacío o con un campo que no se puede cambiar (como `id`) lanza sin consultar. Un `id` que no existe lanza `NotFoundError`.

`registerOrganization({ organization, admin })` crea la organización, la persona que la registra y su rol `organization_admin` en la misma transacción. Es la única forma de tener ese rol: `assignRole`, `revokeRole` y `changeRole` lanzan `person_role.role.protected` si se les pide `organization_admin`.

`removePerson` no borra al `organization_admin` (`person.protected`) ni a un teacher que está en algún curso (`person.enrolled`). Un student se borra con sus matrículas.

`changeRole({ personId, from, to })` quita `from` y pone `to` en la misma transacción. Lanza `person_role.role.protected` si toca `organization_admin`, `person_role.role.unchanged` si `from` y `to` coinciden, `person_role.missing` si la persona no tiene `from` y `person_role.role.enrolled` si la persona está en algún curso. `revokeRole` aplica la misma regla a student y teacher; `organization_admin` se revoca sin mirar cursos.

Ninguna escritura devuelve `null`: si sale bien devuelve la fila, y si no, lanza. Si un INSERT o UPDATE no devuelve fila, se lanza `PersistenceError` (`course.not_created`, `course.not_updated`). Los borrados (`remove*`, `unenrollPerson`, `revokeRole`) hacen `DELETE … RETURNING` y devuelven la fila borrada (`{ person }`, `{ personCourse }`…); si no había nada que borrar, lanzan `NotFoundError` (`person.missing`, `person_course.missing`). Las lecturas por `id` siguen devolviendo `null`.

Las funciones públicas reciben y devuelven un objeto (RORO). Las queries viven en `src/postgres/queries/`. El pool y los ejecutores viven en `src/postgres/`, y la lectura de filas (`personFromRow`, `courseFromRow`) en `src/postgres/rows/`. `src/shared/types/` solo tiene tipos: `interface` para las entidades y `type` para `RoleName` y los derivados (`PersonCreate`, `PersonUpdate`…). Los `assert*`, `normalize*`, `is*` y `ROLE_NAMES` viven en `src/shared/validation/`, un fichero por entidad más `assert.ts` con los genéricos. Los casos de uso validan parámetros, aplican reglas, persisten y sanean la respuesta. Un fallo de tipo o de regla lanza un error de dominio (`ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` o `PersistenceError`). El campo `id` identifica el caso (`person.email.taken`, `course.end_at.order`). El campo `kind` es VALIDATION, NOT_FOUND, CONFLICT, CONFIGURATION o PERSISTENCE. Se busca en el catálogo de `src/shared/errors.ts`. Las clases vienen de `@atempo/errors` (`errors/node/`), y `src/shared/errors.ts` crea `domainError` y `fail` con su `createErrorFactory`. El paquete lanza con `fail(label, reason)`. Un valor que no es string da `string` (`course.name.string`); un string vacío donde no se admite da `empty`. Las filas de course y person que se leen de PostgreSQL pasan por `courseFromRow` y `personFromRow`, que solo comprueban la forma: un valor guardado que la entrada no aceptaría no rompe el listado. Un `23505` o `23503` de `pg` reutiliza el mismo `id` que el find. Un `23503` en un DELETE (el padre todavía tiene hijos) es `ConflictError` con `referenced`, por ejemplo `person.referenced`. El `P0001` del trigger `person_role_student_is_exclusive` es `person_role.student.exclusive`. Cualquier otro error de PostgreSQL, también no poder conectar, es `postgres.unmapped`.

## Instalar y probar

Desde `data-access/node/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm install` lanza el script `prepare` de este paquete, que instala y compila `errors/node/`: `@atempo/errors` se enlaza con `link:../../errors/node` y su `dist/` tiene que existir antes de `typecheck`, `lint`, `test` y `build`.

`pnpm test` sustituye el driver: PostgreSQL no tiene que estar en marcha. La CI lo lanza con `pnpm test:ci`. Los tests cubren `DATABASE_URL` ausente, ping ok, ping fallido, `find*` que lanza sin llamar al driver, listar u obtener una fila, listar por relación (`retrieveAllXByY`), add/modify/remove, `changeRole`, un remove que hace ROLLBACK a mitad, y las reglas (`end_at`, `contract_address`, student exclusivo, unicidades, matrícula o rol repetidos, ids que no existen, `birth_date` inválida).

Antes de un INSERT o UPDATE, `data-access/node/` comprueba esas reglas. Si fallan, no escribe. El CHECK y el trigger de PostgreSQL se quedan. Un `23505` o `23503` de `pg` se traduce al mismo `id` de dominio. `enrollPerson` mira persona, curso, matrícula y rol en una sola consulta, dentro de la transacción del INSERT. Solo un student o un teacher se matricula: otro caso es `person_course.role_required`. `assignRole` comprueba persona, student exclusivo y rol repetido dentro de la transacción de su INSERT.

El email se recorta y pasa a minúsculas, igual que el login del escritorio. `contract_address` se guarda en hex minúsculas: `0xABC…` y `0xabc…` son la misma dirección. `start_at` y `end_at` entran con `Z` o un desfase (`+01:00`) y salen como ISO UTC (`2026-09-01T08:00:00.000Z`). Una hora sin zona (`2026-09-01T08:00`) se rechaza. `birth_date` sale como `YYYY-MM-DD`. Un remove de persona, curso u organización borra las filas hijas (`person_role`, `person_course` y, en organización, también sus cursos) en `BEGIN` / `COMMIT` sobre un mismo cliente del pool. Si el último DELETE falla, hay `ROLLBACK`. Borrar una organización quita todos sus cursos y matrículas. El esquema no usa `ON DELETE CASCADE`.

## Conexión

La conexión real usa `DATABASE_URL` (timeout 3 s). `check()` ejecuta `SELECT 1` y devuelve `{ ok: true }`. Si una conexión se rompe (PostgreSQL se reinicia o se corta la red), el error se escribe con `console.error` y el proceso sigue. Si estaba esperando en el pool, pg la descarta y la siguiente query abre otra. Si estaba dentro de una transacción, la transacción falla y la conexión se destruye. Si en una transacción falla también el `ROLLBACK`, la conexión se destruye con `release(error)` en lugar de volver al pool.
