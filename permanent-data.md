# Datos permanentes entre almacenes

Mapa de enlaces. No es un quinto almacén. El modelo de cada base está en `docs/POSTGRES.md`, `docs/SQLITE.md`, `docs/RUSTFS.md` y `docs/BLOCKEND.md`.

Ninguna aplicación abre estas bases aquí. Los clientes visuales solo consultan.

## Enlaces

| Dato | Dónde nace | Dónde se copia |
| --- | --- | --- |
| `person.id` | PostgreSQL `person` | SQLite `session.professor_id`, `attendance.student_id`; contrato `professorId`, `studentId` |
| `course.id` | PostgreSQL `course` | SQLite `session.course_id`; constructor del contrato (`courseId`) |
| `course.contract_address` | Hardhat al desplegar en Anvil | PostgreSQL `course.contract_address` (`0x` + 40 hex). Si el despliegue falla, no hay fila de curso |
| `session.id` | SQLite `session` | Contrato `createSession` |
| `documentId` | UUID nuevo al subir el justificante | Clave del objeto en RustFS; campo `documentId` de la ficha en el contrato |
| Sello de cierre | `closedAt` en el contrato | Se lee con `getSession`. El `transactionHash` de `closeSession` sigue en Anvil. SQLite no guarda copia |

UUID entre bases: referencia lógica, no FK SQL.

## Qué se consulta dónde

- Fichaje, `status` operativo y profesor de la sesión: SQLite (Datasette)
- Tablas core y `contract_address`: PostgreSQL (Drizzle Studio)
- Justificante (bytes y `content-type`): consola de RustFS, clave `documentId`
- Hechos tras el cierre y sello: `getSession` en el contrato; Otterscan muestra la transacción de `closeSession`
