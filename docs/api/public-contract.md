# Contrato público de consumo frontend

Versión **0.1.0-proposal**, 2026-11-16 · [Issue #88](https://github.com/venturars/aTempo/issues/88) · [PR #94](https://github.com/venturars/aTempo/pull/94).

**Estado y alcance.** Rutas, DTO, códigos y reglas de este documento son **PROPUESTA** para revisión frontend + backend/SDK. No hay acuerdos ni operaciones de dominio disponibles acreditados. La ubicación de este documento también está **PENDIENTE** de ratificación. «Observado» describe código en una ref concreta; «local» o «inactivo» no implica una operación remota. El acuerdo externo de #88 sigue pendiente aunque los ejemplos pasen comprobaciones locales.

## Fuentes y frontera

Inspección: 2026-11-16. Las issues son fuentes editables; los enlaces a código fijan su SHA.

| Fuente | Estado usado |
| --- | --- |
| [staging ab35df7](https://github.com/venturars/aTempo/tree/ab35df73e4f0f3b7c60e33ca381cda16a3781b59) | Base del documento. Login y registro validan en memoria; alumno es maqueta y profesor sigue en construcción. |
| [frontend 369cc89](https://github.com/venturars/aTempo/tree/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src) | Árbol bajo revisión, no integrado en staging. Fuente de necesidades de alumno y profesor de la matriz. |
| [#86](https://github.com/venturars/aTempo/issues/86), [PR #87, README a 94d27f8](https://github.com/venturars/aTempo/blob/94d27f84b39796da1b03eceea401c3f0228115c5/API-router/README.md) | Esqueleto, PR abierta sin merge: solo `GET /health` → HTTP 200 `{"status":"ok"}`. Esto no acredita despliegue en staging ni disponibilidad de dominio. SDK futura. |
| [#32, modelo](https://github.com/venturars/aTempo/issues/32) | Diseño de datos y cadena, no API implementada. Sesión inmutable en cadena, correcciones sobre ficha; estados definitivos al cierre. |
| [#59, identidad](https://github.com/venturars/aTempo/issues/59) | Propuesta Auth0 con decisiones abiertas sobre alta, roles, flujo, callback y transporte. |
| [principles.md](https://github.com/venturars/aTempo/blob/ab35df73e4f0f3b7c60e33ca381cda16a3781b59/principles.md), [arquitectura actual](https://github.com/venturars/aTempo/blob/ab35df73e4f0f3b7c60e33ca381cda16a3781b59/docs/ARCHITECTURE.md) | Visión del futuro portal web del alumno y auditoría; arquitectura Electron actual. El portal web no está entregado por esta propuesta. |

Frontera objetivo de #88: profesor Electron / futuro alumno web → **REST público Nest** → **SDK en repositorio separado** → servicios privados. El router adapta HTTP y delega reglas en SDK. El placeholder hermano `sdk/` descrito en #87 no acredita ese repositorio ni una SDK implementada; su distribución se coordinará. El frontend no accede directamente a DB, SQL, RPC, MinIO ni blockchain, ni recibe direcciones internas. Las lecturas cacheadas/indexadas sirven para mostrar datos; no autorizan ni revocan escrituras.

La SQLite que abre el main de Electron en staging es local y separada del diseño operativo privado de #32. Este documento no cambia main, preload, renderer ni sus stores.

## Matriz de necesidades observadas

Las referencias F siguientes pertenecen exclusivamente a **369cc89**, pendiente de revisión. Los símbolos nombrados permiten localizar cada dato/acción; todos los destinos REST son propuestos. En staging se mantiene el estado descrito arriba.

| Ref | Fichero permanente y símbolos |
| --- | --- |
| F1 | [login/](https://github.com/venturars/aTempo/tree/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/login): `LoginScreen`, `useLoginStore`, `validateLogin`; [register/](https://github.com/venturars/aTempo/tree/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/register): `RegisterScreen`, `useRegisterStore`, `validateRegister`. |
| F2 | [sessionStore.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/session/sessionStore.ts): `Profile`, `startStudentSession`, `dashboardPathForProfile`; [studentAccounts.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/studentAccounts.ts): `useCurrentStudent`, `findByEmail`, `addAccount`, `recordEntry`. |
| F3 | [studentExample.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/studentExample.ts): `ClassEntry`, `TodayClass`, `sampleReadings`, `lateMinutes`; [attendanceStatus.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/attendanceStatus.ts): `statusForArrival`. |
| F4 | [DashboardScreen](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/dashboard/DashboardScreen.tsx), [ScanScreen](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/scan/ScanScreen.tsx) (`onReading`), [HistoryScreen](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/student/history/HistoryScreen.tsx). |
| F5 | [PanelScreen.tsx](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/PanelScreen.tsx): `TodayView`, `ClassesView`, `RosterTable`, `StudentFile`, `TimeField`, `CloseDialog`; [panelStore.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/panelStore.ts): acciones de sesión, marcas y selección. |
| F6 | [roster.ts](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/roster.ts): `course`, `ClassSession`, `RosterRow`, `HistoryEntry`, `sessionCounts`, `studentSummary`, `studentRisk`; [sessionQr.tsx](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/sessionQr.tsx): `SessionQr`. |
| F7 | [StatsView](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/StatsView.tsx), [MobileAttendance](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/MobileAttendance.tsx), [StudentHistory](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/StudentHistory.tsx), [JustificationAccess](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/JustificationAccess.tsx). |
| F8 | [SettingsView](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/SettingsView.tsx), [settingsStore](https://github.com/venturars/aTempo/blob/369cc8901e55852067acf6ed463a1a311e7eb6a3/desktop/src/renderer/src/panel/settingsStore.ts): `Preferences`, `update`. |

| Pantalla / ref | Campo o acción y necesidad | Operación → DTO/campo, o comportamiento local |
| --- | --- | --- |
| Login / F1–F2 | Correo, contraseña, errores, enviar | Validación y comparación contra cuentas en memoria. Flujo de identidad pendiente #59; no enviar contraseñas del mock al router. Tras autenticación futura, I1 → `Identity`. |
| Registro / F1–F2 | Nombre, correo, contraseña, repetición, errores, alta y duplicado de correo | Alta local `addAccount`; política de alta pública pendiente #59, sin endpoint de contraseña propuesto. Nombre/correo futuros → `Identity`; repetición/visibilidad de contraseña solo local. |
| Identidad / F2, F4–F5 | Saludo, nombre, perfil, correo y ruta del perfil | I1 → `personId`, `displayName`, `email`, `role`. `startStudentSession` y fallback de cuenta son mock; navegación local no constituye autorización. Perfil profesor de F5 está fijado en pantalla. |
| Alumno dashboard / F4 | Registrar asistencia, resumen | Navegación local a escaneo/historial; consultas A2/A4. |
| Alumno dashboard / F4 | Próxima clase; avisar retrasos o ausencias | Botones inactivos, sin operación en esta versión. A2 abastece la clase del escáner, no implementa estos botones. |
| Alumno escaneo / F3–F4 | Fecha, inicio y código de clase; margen | A1/A2 → `Course`, `Session.startsAt`, `timeZone`, `lateAfterMinutes`. Etiquetas se formatean localmente. |
| Alumno escaneo / F2–F4 | Escanear, lectura válida/ajena, entrada, estado, repetido | Escáner y horas simulados. A3/A5 → `ArrivalRequest`, `ArrivalResult`, `Operation`. `recordEntry` deduplica por etiqueta local; futuro por identidad estable. Abrir/cerrar lector y volver son locales. |
| Alumno historial / F3–F4 | Fecha, hora nullable, estado y lista vacía | A4 → `HistoryItem.session`, `attendance.checkedInAt`, `status`; lista vacía `items: []`. |
| Profesor dashboard / F5–F6 | Hoy/próxima fecha, curso, aula, horario, fase | T1/T2 → `Course.name`, `Session.room`, `startsAt`, `endsAt`, `phase`. |
| Profesor dashboard / F5–F6 | Abrir, confirmar/cancelar cierre, cerrar, volver a abrir | T3 → `SessionCommand`; confirmación local. Reapertura propuesta bloqueada por decisión D5. No traducir directamente `reopenSession` a cadena. |
| Profesor dashboard / F5–F6 | Mostrar QR de sesión | T4 → `Qr`; dibujo actual sintético `SessionQr`, sin token real. |
| Profesor listado / F5–F6 | Nombre, entrada, marca, pendientes, recuentos | T5 → `RosterItem.person`, `attendance`; totales derivados. `rollStatus` distingue programada/sin marca y abierta/pendiente. |
| Profesor listado / F5 | Cambiar estado/hora de llegada | T6 → `CorrectionRequest`, `Attendance`; `setMark`/`setTime` solo abiertos localmente. No sobrescribir fichaje aceptado ni borrar evidencia. |
| Profesor sesiones / F5–F6 | Fechas, cancelación, porcentajes, presentes/tarde/ausentes, abrir detalle | T2/T5 → `Session.phase`, roster; porcentaje derivado. Selección local; cancelada no abre detalle en el prototipo. No hay acción de cancelar sesión. |
| Profesor histórico / F5–F7 | Cambiar marca histórica, abrir ficha, resumen %, tarde/ausencias, fecha/hora/estado | T6/T7 → corrección e historial. `setSessionMark` local no conserva auditoría; remota requiere razón/autor/hora. |
| Profesor estadísticas / F6–F7 | Matriz alumno-fecha, entrada por celda, canceladas, totales y reconocimientos | T2/T5 → sesiones/roster; cálculos locales de `StatsView`/`MobileAttendance` excluyen canceladas. Reconocimientos derivados, sin endpoint nuevo. |
| Profesor avisos / F6 | Riesgo de faltar/llegar tarde y explicación | `studentRisk`, `absenceRisk`, `lateRisk` derivan historial T7: dos ausencias/retrasos en últimas cuatro. Prototipo informativo; no confundir con regla distinta de organización en staging. |
| Profesor justificantes / F6–F7 | Estado, fecha, alumno, pendientes, abrir listado/ficha/documento | T5/T7 → `Attendance.justification`. Diálogo local, sin archivo adjunto; no hay subida, aprobación ni descarga implementada ni endpoint nuevo en este alcance. |
| Profesor ajustes / F8 | Margen 0–60 min; llegada, antes de inicio, antes de tarde, resumen, antes de fin | Preferencias locales `lateMinutes`, `arrival`, `beforeStart`, `beforeLate`, `lateSummary`, `beforeEnd`. Probar/pausar/cerrar aviso son demo local. Margen remoto efectivo solo se lee en `Session.lateAfterMinutes`; persistir/cambiar regla exige D6. |
| Todas / F1–F8 | Pestañas, filtros rango/días/fechas, orden, scroll, celdas, tema, diálogos, volver | Estado local; sin endpoints. Filtrado de datos completos ya autorizados. Figuras del login/registro y avatares son presentación. |

## Catálogo REST propuesto

Prefijo propuesto `/v1`. JSON en cuerpos; GET sin cuerpo. Cada fila referencia esquemas de la sección siguiente y ejemplos E1–E6. No se decide host ni transporte de credenciales. I1 supone identidad ya autenticada por el flujo que cierre #59; alta, login, renovación y logout quedan por definir allí, no son endpoints inventados aquí.

El servidor verifica identidad, rol y relación con **cada recurso**: alumno solo cursos matriculados, sus sesiones y su asistencia; profesor solo cursos/sesiones asignados y alumnos de esos cursos. Identificadores de ruta y QR no otorgan permisos. El servidor obtiene el alumno de la identidad autenticada; A3 no acepta un `studentId` arbitrario. Acceso administrativo y multirrol requieren decisión #59.

| ID | Método y ruta | Parámetros / petición | Respuesta de éxito | Autorización |
| --- | --- | --- | --- | --- |
| I1 | `GET /v1/me` | Ninguno | 200 `Identity` (E1) | Identidad autenticada |
| A1 | `GET /v1/me/courses` | Ninguno | 200 `List<Course>` | Alumno matriculado |
| A2 | `GET /v1/me/courses/{courseId}/sessions` | `courseId: Id` | 200 `List<Session>` (E2) | Alumno matriculado |
| A3 | `POST /v1/sessions/{sessionId}/arrivals` | `sessionId: Id`; `ArrivalRequest`; `Idempotency-Key: Id` igual a `operationId` | 201 `ArrivalResult` nuevo, 200 mismo resultado duplicado (E3) | Alumno matriculado, QR válido de esa sesión |
| A4 | `GET /v1/me/courses/{courseId}/attendance` | `courseId: Id` | 200 `List<HistoryItem>` | Alumno, solo su historial |
| A5 | `GET /v1/operations/{operationId}` | `operationId: Id` | 200 `Operation` (E4) | Autor de operación o profesor asignado con permiso de consulta |
| T1 | `GET /v1/teacher/courses` | Ninguno | 200 `List<Course>` | Profesor asignado |
| T2 | `GET /v1/teacher/courses/{courseId}/sessions` | `courseId: Id` | 200 `List<Session>` (E2) | Profesor asignado |
| T3 | `POST /v1/sessions/{sessionId}/commands` | `sessionId: Id`; `SessionCommand`; misma cabecera de idempotencia | 200 `Session` (E2, sin envoltorio `items`) | Profesor asignado; transición autorizada; reapertura pendiente D5 |
| T4 | `GET /v1/sessions/{sessionId}/qr` | `sessionId: Id` | 200 `Qr` (E5) | Profesor asignado; sesión abierta |
| T5 | `GET /v1/sessions/{sessionId}/attendance` | `sessionId: Id` | 200 `List<RosterItem>` | Profesor asignado |
| T6 | `POST /v1/sessions/{sessionId}/students/{personId}/corrections` | Ambos `Id`; `CorrectionRequest`; misma cabecera de idempotencia | 200 `Attendance` (E3 `attendance`) | Profesor asignado; alumno matriculado; política/auditoría D5 |
| T7 | `GET /v1/courses/{courseId}/students/{personId}/attendance` | Ambos `Id` | 200 `List<HistoryItem>` | Profesor asignado; alumno de ese curso |

Todos: 400 formato inválido, 401 sin sesión válida, 403 sin permiso, 404 recurso no encontrado dentro del ámbito autorizado, 503 indisponibilidad. A3 añade 422 QR y 409 conflicto; T3/T6 añaden 409 versión/transición y 422 regla inválida; T4 añade 409 sesión no abierta. Cuerpos de error: `Error` (E6). Código HTTP por sí solo no prueba aceptación. Si se acuerda procesamiento asíncrono, HTTP 202 solo indicaría operación pendiente (D4), nunca llegada aceptada.

## Esquemas propuestos

Todos los campos tabulados son **obligatorios**, salvo indicación «opcional»; `?` significa nullable, no omitible. No se admiten campos extra en las peticiones de esta propuesta. `Id` = string UUID propuesto, estable y opaco, no acuerdo de identificadores públicos existente. `Instant` = string ISO 8601 UTC con `Z`; `timeZone` = zona IANA para presentar fechas/horas. Números enteros salvo indicación. No hay timestamps de cliente para decidir aceptación. Nunca usar nombres, índices de fila o etiquetas de fecha como identidad remota; el DTO público no copia automáticamente las tablas de #32.

| DTO | Campos: tipo / unidad / significado |
| --- | --- |
| `Identity` | `personId: Id`; `displayName: string` no vacío; `email: string` correo; `role: student \| teacher \| organization_admin` (mapeo público por acordar). |
| `Course` | `id: Id`; `name: string` no vacío. |
| `Session` | `id: Id`; `courseId: Id`; `startsAt: Instant`; `endsAt: Instant` posterior al inicio; `timeZone: string`; `room: string?`; `phase: scheduled \| open \| closed \| cancelled`; `lateAfterMinutes: integer` 0–60 minutos; `version: integer` ≥1. Fases son vista pública propuesta, no lifecycle de cadena acordado. |
| `List<T>` | `items: T[]`, completo en este borrador; `asOf: Instant` momento de la proyección. Paginación/límites pendientes antes de producción. |
| `PersonSummary` | `id: Id`; `displayName: string`. |
| `Attendance` | `sessionId: Id`; `personId: Id`; `checkedInAt: Instant?`; `status: pending \| present \| present_late \| absent \| notified_absence`; `justification: none \| pending \| justified \| rejected`; `version: integer` ≥1. `pending` significa clasificación aún sin resolver, no operación pendiente. `checkedInAt = null` no implica ausencia antes del cierre. |
| `RosterItem` | `person: PersonSummary`; `attendance: Attendance`. |
| `HistoryItem` | `session: Session`; `attendance: Attendance` de la misma sesión. |
| `Qr` | `sessionId: Id`; `payload: string` opaco no vacío; `expiresAt: Instant`. El servidor verifica vínculo, integridad y caducidad; no confiar en contenido decodificado en cliente. |
| `ArrivalRequest` | `operationId: Id`; `qrPayload: string` opaco no vacío. Sesión en ruta y alumno autenticado, sin hora ni estado enviados por el cliente. |
| `ArrivalResult` | `operationId: Id`; `acceptance: accepted`; `acceptedAt: Instant` hora canónica conservada del recibo; `attendance: Attendance` con llegada no null y `present` o `present_late`; `serverTime: Instant` hora del recibo. Mismo recibo para duplicado. |
| `Operation` | `operationId: Id`; `state: pending \| succeeded \| rejected`; `result: ArrivalResult?`; `error: Error?`; `serverTime: Instant` hora actual de consulta. `pending`: ambos null; `succeeded`: result no null/error null; `rejected`: result null/error no null. Reconciliación definida aquí para A3; comandos/correcciones reproducen respuesta con la misma clave. |
| `SessionCommand` | `operationId: Id`; `action: open \| close \| reopen`; `expectedVersion: integer` ≥1; `reason: string?` (no vacío para reapertura). |
| `CorrectionRequest` | `operationId: Id`; `expectedVersion: integer` ≥1; `status: Attendance.status`; `checkedInAt: Instant?`; `reason: string` no vacío. Corrección propuesta, no un segundo fichaje; preservar evento original y auditoría. Estados/horas incompatibles → 422. |
| `Error` | `code: ErrorCode`; `message: string` sin datos privados; `operationId: Id?` (null si no se conoce); `serverTime: Instant`. |

`ErrorCode` y HTTP propuestos:

| HTTP | Códigos | Semántica para el consumidor |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | Corregir tipos/campos; no inventar aceptación. |
| 401 | `UNAUTHENTICATED` | Recuperar identidad mediante flujo pendiente #59. |
| 403 | `FORBIDDEN` | Detener acción; servidor ha denegado permiso. |
| 404 | `NOT_FOUND`, `OPERATION_NOT_FOUND` | Recurso no visible/no encontrado; una operación no encontrada no prueba rechazo de llegada. |
| 409 | `IDEMPOTENCY_CONFLICT`, `VERSION_CONFLICT`, `SESSION_NOT_OPEN`, `TRANSITION_NOT_ALLOWED` | No sobrescribir resultado; releer/reconciliar y resolver conflicto. |
| 422 | `QR_INVALID`, `QR_EXPIRED`, `QR_SESSION_MISMATCH`, `INVALID_CORRECTION` | Rechazo explícito de esta petición; mostrar motivo. |
| 503 | `UNAVAILABLE` | Resultado de una escritura puede ser desconocido; reconciliar. |

No se publica `blockchainFinality`: su definición, evidencia y lifecycle quedan pendientes D4. `acceptance: accepted` es el reconocimiento autoritativo de llegada propuesto, independiente de la clasificación de asistencia y del estado de operación. No acredita presencia durante toda la clase.

## Ejemplos representativos

Datos sintéticos. IDs coherentes: curso `…0001`, sesión `…0002`, alumno `…0003`, operación `…0004`. Cada bloque es un cuerpo JSON completo; parámetros/cabeceras se describen fuera. Los demás éxitos del catálogo reutilizan estos DTO: listas de cursos/roster/historial usan `List<T>`, y T3/T6 devuelven el objeto indicado, sin campos adicionales.

E1 — I1, 200 tras autenticación por acordar:

```json
{"personId":"00000000-0000-4000-8000-000000000003","displayName":"Alumno de ejemplo","email":"alumno@example.test","role":"student"}
```

E2 — A2 o T2, 200:

```json
{"items":[{"id":"00000000-0000-4000-8000-000000000002","courseId":"00000000-0000-4000-8000-000000000001","startsAt":"2026-11-16T08:00:00Z","endsAt":"2026-11-16T17:00:00Z","timeZone":"Europe/Madrid","room":"Aula de ejemplo","phase":"open","lateAfterMinutes":10,"version":1}],"asOf":"2026-11-16T07:58:00Z"}
```

E3 — A3, ruta sesión `…0002`; cabecera `Idempotency-Key: 00000000-0000-4000-8000-000000000004`. Petición:

```json
{"operationId":"00000000-0000-4000-8000-000000000004","qrPayload":"qr-sintetico-sesion-2"}
```

201, llegada a tiempo (08:58 en Madrid). Repetir la misma petición/clave devuelve 200 con este mismo recibo:

```json
{"operationId":"00000000-0000-4000-8000-000000000004","acceptance":"accepted","acceptedAt":"2026-11-16T07:58:00Z","attendance":{"sessionId":"00000000-0000-4000-8000-000000000002","personId":"00000000-0000-4000-8000-000000000003","checkedInAt":"2026-11-16T07:58:00Z","status":"present","justification":"none","version":1},"serverTime":"2026-11-16T07:58:00Z"}
```

Variante tarde: misma sesión y alumno en **otro caso independiente**, operación `00000000-0000-4000-8000-000000000005`; sustituir las tres horas del recibo por `2026-11-16T08:14:00Z` y estado por `present_late`. En este caso usar un QR renovado, payload `qr-sintetico-sesion-2-tarde`, con expiración `2026-11-16T08:20:00Z`, en petición y respuesta T4. No representa un segundo fichaje del mismo alumno ya aceptado. Límite propuesto: hasta inicio + margen incluido es `present`; después, `present_late`, sujeto a política de admisión pendiente D3/D6.

E4 — A5 tras perder respuesta, operación `…0004`. Ejemplo 200 pendiente, todavía sin aceptación acreditada:

```json
{"operationId":"00000000-0000-4000-8000-000000000004","state":"pending","result":null,"error":null,"serverTime":"2026-11-16T07:58:01Z"}
```

Al resolverse, `state: succeeded`, `result` es exactamente E3 y `error: null`; `serverTime` refleja la consulta. Si se rechaza, `state: rejected`, `result: null` y `error` es E6 con el código de rechazo correspondiente. Nunca convertir E4 pendiente en «Ausente».

E5 — T4, 200:

```json
{"sessionId":"00000000-0000-4000-8000-000000000002","payload":"qr-sintetico-sesion-2","expiresAt":"2026-11-16T08:05:00Z"}
```

E6 — A3, 409 si se reutiliza la clave E3 cambiando el payload; no altera el recibo original:

```json
{"code":"IDEMPOTENCY_CONFLICT","message":"La clave ya corresponde a otra petición.","operationId":"00000000-0000-4000-8000-000000000004","serverTime":"2026-11-16T07:59:00Z"}
```

Para probar QR ajeno/inválido/caducado, usar una operación nueva, payload diferente y E6 con HTTP 422 / `QR_SESSION_MISMATCH`, `QR_INVALID` o `QR_EXPIRED`. Sin sesión, E6 con 401 / `UNAUTHENTICATED` y `operationId: null`; rol ajeno, 403 / `FORBIDDEN`. Estos son casos independientes; no pueden revocar una aceptación previa.

T3 petición de cierre, ruta sesión `…0002`; clave igual a `operationId`. Devuelve Session de E2 con fase `closed` y versión 2 solo cuando el servidor confirme esa transición pública:

```json
{"operationId":"00000000-0000-4000-8000-000000000006","action":"close","expectedVersion":1,"reason":null}
```

T6 petición de corrección, ruta sesión `…0002` / alumno `…0003`, otra clave. Caso independiente que corrige una ficha equivocada y conserva la anterior en auditoría; devuelve Attendance de E3 con los valores corregidos y versión 2:

```json
{"operationId":"00000000-0000-4000-8000-000000000007","expectedVersion":1,"status":"present_late","checkedInAt":"2026-11-16T08:14:00Z","reason":"Hora revisada con evidencia de entrada."}
```

## Llegada, duplicados y reconciliación

Propuesta de invariantes a acordar con backend/SDK:

1. El servidor público es la autoridad de aceptación y de hora. Devuelve el recibo después de conservarlo de forma recuperable. El reloj cliente solo presenta fechas en `Session.timeZone`; no decide puntualidad, expiración ni orden frente al cierre.
2. El consumidor conserva `operationId`, clave y petición exacta antes de enviar. Una clave tiene ámbito de autor + operación; reutilizarla con otro contenido produce conflicto. Nueva clave para la misma sesión/alumno ya aceptado debe recuperar la llegada original, sin cambiar hora ni crear otra asistencia; detalle de retención/identidad de esa operación pendiente D3.
3. Timeout, desconexión, 503 o lectura atrasada significan **resultado desconocido**. Consultar A5 con el mismo identificador; mantener «Comprobando registro». No marcar éxito ni ausencia, no generar una clave nueva ni reintentar automáticamente una escritura de aceptación desconocida. Un reenvío deliberado solo conserva clave/cuerpo, después de reconciliar y cuando se acuerden garantías D3.
4. A5 pendiente se sigue consultando con espera limitada por acordar. `OPERATION_NOT_FOUND` puede reflejar recepción aún no visible: conservar contexto y resolver por el canal de reconciliación; no deducir rechazo. `succeeded` con recibo acredita aceptación; `rejected` acredita rechazo de esa operación. El estado de operación no es clasificación de asistencia ni finalización blockchain.
5. Ante cierre concurrente, autoridad pública serializa/reconcilia llegada y cierre (orden exacto D4). Si aceptó llegada, cierre/reintento no puede convertirla en ausencia. Si no la aceptó y ya no admite llegadas, devolver `SESSION_NOT_OPEN` explícito. Nunca fabricar `absent` en cliente por faltar en un índice.
6. Conservar recibo aceptado aunque listado/historial aún muestre `pending`, `absent` o ninguna fila; refrescar/reconciliar hasta converger. Una corrección autorizada conserva evento original, razón, autor y hora; no borra la llegada. Reapertura no reinicia ni elimina fichajes.

| Caso a recorrer | Resultado propuesto / evidencia necesaria |
| --- | --- |
| A tiempo / tarde | E3 y variante; servidor calcula hora/margen. Umbral y ventana D6. |
| Mismo cuerpo/clave, respuesta duplicada | 200 mismo recibo; también después de cierre, sin segunda escritura. Retención D3. |
| Misma clave, cuerpo distinto | E6 409, recibo original intacto. |
| QR ajeno/inválido/caducado; sin sesión/permisos | Errores E6 según catálogo; sin aceptación inventada. |
| Respuesta perdida | A5 → pendiente o resultado; conservar contexto y recibo. Sin reintento automático. |
| Cierre concurrente | E3 conservado o rechazo explícito; política exacta pendiente D4. |
| Proyección atrasada / cadena pendiente | Reconciliar; una llegada aceptada nunca pasa a ausencia por estas causas. |

## Decisiones y revisión

Responsables **por rol**, identidades por confirmar en coordinación de #88. Todas las decisiones y revisiones externas están **PENDIENTES**; no hay aprobación registrada.

| Decisión | Responsable de coordinación | Propuesta y divergencia | Evidencia requerida / efecto frontend |
| --- | --- | --- | --- |
| D1 Ubicación, versión, rutas, DTO y errores | Frontend + backend/SDK | Ratificar este documento y catálogo; separar contrato público de modelo interno #32. | Revisión explícita de versión/ubicación, esquema acordado y ejemplos validados contra él; permite generar consumidor. |
| D2 Identidad/alta/autorización #59 | Identidad + backend + frontend | I1 mínimo; proveedor, roles, vínculo a persona, alta, login/logout/renovación, tokens y transporte sin decidir. Sin contraseñas mock hacia Nest. | Acuerdo de flujo y permisos con casos 401/403; desbloquea integración de identidad. |
| D3 Identificadores/idempotencia/reconciliación | Backend/SDK + frontend | UUID públicos propuestos; clave durable, recibo recuperable y no reintento automático desconocido. Definir retención, consulta autoritativa, operación no encontrada y nueva clave para llegada existente. | Garantías probadas con pérdida de respuesta/duplicados; evita fichajes dobles y falsos rechazos. |
| D4 Hora, concurrencia y finalización | Backend/SDK + responsables del modelo | Hora canónica servidor. Aceptación, operación y cadena separadas. #32 define `open/closing/closed` internos; no copiarlos como garantía REST ni decidir finalización aquí. | Orden llegada/cierre, durabilidad del recibo, respuesta asíncrona y evidencia de finalización acordados; decide mensajes de espera. |
| D5 Reapertura y corrección | Producto + modelo + backend/SDK + frontend | UI reabre/cambia histórico; sesión en cadena #32 inmutable. Recomendar enmienda auditada de ficha, no reescritura de sesión. | Política explícita sobre botón reabrir, autorizaciones, razón/autor/hora y versiones. Mientras tanto no integrar reapertura remota. |
| D6 Estados/margen/configuración | Producto + modelo + backend/SDK | `tarde` alumno y `retraso` profesor → propuesta `present_late`. UI usa pendiente antes de cierre; #32 calcula estados al cierre y admite `notified_absence`. Regla pública provisional separada de clasificación definitiva. Ajustes son locales, margen 0–60 y diez minutos del fixture no son acuerdo. | Mapeo, umbrales, ventana de admisión, persistencia de preferencias y fórmula de porcentaje acordados; evita ausencias anticipadas. |
| D7 Justificantes y auditoría | Producto + backend/SDK + frontend | UI solo abre ejemplo sin archivo; #32 separa archivo/estado. No proyectar descarga directa de MinIO. `none/pend/ok/no` de UI requiere mapeo contextual (sin justificante no equivale automáticamente a rechazado). | Contrato público futuro de documentos y correcciones, con permisos; sin prometer subida/aprobación existente. |

| Revisión | Estado / evidencia |
| --- | --- |
| Frontend de esta versión | PENDIENTE de revisión explícita y ref registrada. Inspección de fuentes no equivale a aprobación. |
| Backend/SDK e identidad | PENDIENTE, sin persona ni aprobación atribuida. |
| Validación documental local | Borrador comprobable con `git diff --check` y Node sobre JSON/campos/tipos/códigos/enlaces; resultados en PR/issue. No es validación formal OpenAPI ni validación del backend. |
| Aceptación externa de #88 (TASK-08) | PENDIENTE: ubicación, versión, decisiones y ejemplos contra esquema acordado. Spec Borrador y PR draft hasta evidencia. |
