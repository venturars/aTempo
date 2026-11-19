# PostgreSQL core

Uso, configuración y modelo del almacén permanente. Cómo se arranca en el ordenador está en [postgres/README.md](../postgres/README.md). Compose orquesta el mismo PostgreSQL.

Esta base no se abre desde `desktop/` ni desde `api-router/`. Drizzle Studio consulta.

## Qué hay

Seis tablas, nombres en inglés, claves UUID, tiempos `timestamptz`:

- `organization` — `tax_id` obligatorio y único (NIF, CIF, NIF-IVA, NIE)
- `person` — `identification_document` y `email` únicos; `email` también único en minúsculas (`person_email_lower_idx`); sin `role`; sin contraseña; sin `organization_id`
- `course` — `start_at`, `end_at`, `contract_address` UNIQUE (`0x` + 40 hex del contrato Anvil de ese curso); `contract_address` también único en minúsculas (`course_contract_address_lower_idx`)
- `person_course` — N:N; PK `(person_id, course_id)`
- `role` — tres filas: `organization_admin`, `teacher`, `student`
- `person_role` — N:N `person`–`role`; PK `(person_id, role)`

Un `teacher` y un `organization_admin` pueden coincidir. Un `student` no puede llevar ningún otro rol. El esquema lo impide con un trigger.

No hay `session` ni asistencia aquí. Esas tablas viven en SQLite.

## Configuración

El esquema está en `postgres/init/01_schema.sql`. En el host se carga con `psql -f init/01_schema.sql` sobre la base `atempo`, puerto `5432`. Compose lo carga la primera vez que el volumen está vacío y publica el `5433`. Usuario y base por defecto: `atempo`. El formato de `contract_address` y `end_at > start_at` son `CHECK` SQL.

`contract_address` no es una FK: es el texto de la dirección Anvil. Si Hardhat no despliega, no se inserta el curso.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
