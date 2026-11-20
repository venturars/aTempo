# SQLite operativo

Uso, configuración y modelo de la copia de fichaje. Cómo se arranca en el ordenador está en [sqlite/README.md](../sqlite/README.md). Compose orquesta el mismo Datasette.

Esta base no es el `atempo.sqlite` del escritorio. No se abre desde `desktop/` ni desde `api-router/`. Datasette consulta.

## Qué hay

Dos tablas:

- `session` — `professor_id` (UUID de `person.id`), `late_after_minutes`, `expected_count`, `status` (`open` | `closing` | `closed`), `closed_at` solo en `closed`
- `attendance` — PK `(session_id, student_id)`; una fila por alumno del roster; `status` (`present` | `present_late` | `absent` | `notified_absence`); `check_in_method` (`button` | `qr`); `checked_in_at`. `present` y `present_late` llevan método y hora de fichaje dentro de la sesión; `absent` y `notified_absence` van sin fichaje.

`course_id`, `student_id` y `professor_id` son referencias lógicas al core, no FK entre bases.

`expected_count` vive **solo** aquí. No va al contrato.

No hay `absence_notice`, `session_seal`, `recorded_by`, `justification`, `document_id` ni `late_check_in`. Justificación, aviso y documento están en el contrato tras el cierre. El sello se lee con `getSession`.

## Configuración

El esquema está en `sqlite/schema.sql`. Fechas y UUID van como `TEXT`. El esquema solo acepta instantes ISO UTC con milisegundos (`2026-09-01T08:00:00.000Z`), para que el `CHECK (end_at > start_at)` compare bien. En asistencia, `present` y `present_late` exigen método y hora; `absent` y `notified_absence` los prohíben. `closed_at` queda vacío mientras la sesión no está `closed`.

SQLite no añade un `CHECK` a una tabla que ya existe. `schema.sql` solo se aplica al crear el fichero (`sqlite/data/operational.sqlite` o el de `api-sqlite-data`). Un volumen o fichero anterior se queda con el esquema viejo: hay que borrarlo y dejar que se cree de nuevo. No hay un `02` como en PostgreSQL.

Durante la ventana, esta base guarda el fichaje y el `status`. Al cerrar, esos estados se escriben en el contrato. Después, SQLite copia el `status` de `changeStatus`.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
