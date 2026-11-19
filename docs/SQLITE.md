# SQLite operativo

Uso, configuración y modelo de la copia de fichaje. Cómo se arranca en el ordenador está en [sqlite/README.md](../sqlite/README.md). Compose orquesta el mismo Datasette.

Esta base no es el `atempo.sqlite` del escritorio. No se abre desde `desktop/` ni desde `api-router/`. Datasette consulta.

## Qué hay

Dos tablas:

- `session` — `professor_id` (UUID de `person.id`), `late_after_minutes`, `expected_count`, `status` (`open` | `closing` | `closed`), `closed_at` solo en `closed`
- `attendance` — PK `(session_id, student_id)`; una fila por alumno del roster; `status` (`present` | `present_late` | `absent` | `notified_absence`); `check_in_method` (`button` | `qr`); `checked_in_at`

`course_id`, `student_id` y `professor_id` son referencias lógicas al core, no FK entre bases.

`expected_count` vive **solo** aquí. No va al contrato.

No hay `absence_notice`, `session_seal`, `recorded_by`, `justification`, `document_id` ni `late_check_in`. Justificación, aviso y documento están en el contrato tras el cierre. El sello se lee con `getSession`.

## Configuración

El esquema está en `sqlite/schema.sql`. Fechas y UUID van como `TEXT` (ISO-8601 y UUID). `closed_at` queda vacío mientras la sesión no está `closed`.

Durante la ventana, esta base guarda el fichaje y el `status`. Al cerrar, esos estados se escriben en el contrato. Después, SQLite copia el `status` de `changeStatus`.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
