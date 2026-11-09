# aTempo · Gamificación

**Documento funcional · Versión 0.2** · Recorte del producto. Constitución: `README.md`.

Cierra Tempito, juegos, retos y recompensas para un equipo junior, sin pagos. Fuera: QR, certificados, integraciones, chatbot, predicción.

El alumno cuida de Tempito. El profesor lanza un juego de 60 s y ve quién está. Nadie publica un ranking de faltas.

| Pieza | Qué es | Cuándo |
| ----- | ------ | ------ |
| **Tempito** | Mascota de cada alumno. Refleja el cuidado de la asistencia. | Siempre |
| **Juegos en vivo** | Arranque y Pulso. Sustituyen o refuerzan pasar lista. | En clase, los lanza el profesor |
| **Retos** | Objetivos semanales, individuales o de grupo. Dan cosmética. | Lunes a domingo |

## 1. Principios

1. **La clase manda.** Si el juego atrasa la sesión, está mal.
2. **Asistir es cuidar, no competir.** Tempito es personal. El ranking nunca muestra faltas.
3. **Justificar no se penaliza.** `excused` no baja energía, no rompe racha y pausa el reto.
4. **El juego es señal, no certificado.** La evidencia formal vive fuera de este recorte.
5. **Sin sanciones automáticas.** Tempito no evalúa.
6. **Privacidad.** Apodo, ocultarse del tablero, nadie ve el ánimo ajeno.
7. **Apagable** por curso: Tempito, juegos, tablero, retos.

## 2. Contexto mínimo

| Entidad | Qué hay | Qué no |
| ------- | ------- | ------ |
| Curso | Nombre, alumnos, profesor | Calendario complejo, integraciones |
| Sesión | Fecha, `scheduled` \| `live` \| `closed` | QR, geocerca, Meet |
| Asistencia | `present` \| `late` \| `absent` \| `excused` | Auditoría, PDF de justificantes |

El profesor abre la sesión. El alumno entra al juego o pulsa “estoy aquí”. El profesor corrige a mano (el alumno no edita el original) y puede marcar `excused` sin documentos.

## 3. Economía

Una moneda. Sin loot boxes ni pagos. Semillas solo compran cosmética, nunca nota ni certificado.

| Recurso | Rango | Gana | Pierde |
| ------- | ----- | ---- | ------ |
| **Energía** | 0–100 | `present` +10, juego +5, reto +15 | `absent` −20, `late` −5 |
| **Racha** | días lectivos | `present` o `late` +1 | `absent` → 0. `excused` congela |
| **Semillas** | puntos | Arranque 10/6, Pulso 4, reto ind. 25, grupo 15 | Comprar ítem |
| **Cuidado** | vida de la mascota | +1 por día con asistencia válida | Nunca baja. Evoluciona Tempito |

Asistencia válida: `present` y `late`. `excused` no suma ni rompe. `absent` rompe racha y baja energía.

Ítems (se compran una vez; equipar es libre): gorro 40, pañuelo 40, fondo aula 60, fondo parque 80 (o reto de grupo), color aurora 100 (o racha 7), corona de racha 0 (al llegar a 10; se pierde al romperla).

## 4. Tempito

Uno por alumno. El profesor y el admin no lo editan. Evolución permanente (por `cuidado`); ánimo diario (por `energía`).

| Forma | Cuidado | Ánimo | Energía |
| ----- | ------- | ----- | ------- |
| Semilla | 0–2 | Dormido | 0–19 |
| Brote | 3–6 | Bajo | 20–39 |
| Tempito | 7–14 | Bien | 40–79 |
| Tempo | 15+ | Alto | 80–100 |

La forma no retrocede. Si la última sesión es `excused` y aún no ha vuelto: estado **descanso** (“Tempito descansa. La racha está en pausa.”), no se ve como castigo.

Al **cerrar la sesión**, por alumno:

```
present  → energía +10 (máx 100), racha +1, cuidado +1
late     → energía −5 (mín 0), racha +1, cuidado +1
excused  → no cambia nada
absent   → energía −20 (mín 0), racha = 0
```

Varias sesiones el mismo día: racha y cuidado suman **una vez**. La energía sí va por sesión. Si el profesor corrige `absent` → `excused` o `present`, se recalcula ese día. Semillas de juegos se otorgan aparte.

El alumno ve SVG (forma + ánimo + ítems), barras, inventario, últimos 7 días en puntos de color (verde / ámbar / gris descanso / rojo) y el reto activo. El profesor/admin ven forma y racha, **no** energía ni ánimo bajo.

## 5. Juegos en vivo

Dos juegos, un motor `LiveRound`. El profesor lanza; los alumnos responden en tiempo real; el **servidor** cierra por reloj.

### Arranque — 60 s, uno por sesión

Sustituye pasar lista con una pregunta de la clase anterior (texto + 4 opciones). Quien responde está presente, **acierte o falle**. Quien no, queda `pending` (no se marca ausente solo). Se puede cancelar; nadie cobra.

| Resultado | Semillas | Energía |
| --------- | -------- | ------- |
| Acierto | 10 | +5 |
| Error | 6 | +5 |
| No responde | 0 | 0 |

El profesor usa la baraja del curso o escribe la pregunta al momento. Si el alumno entra a los 50 s, juega los 10 restantes.

### Pulso — 20 s, máximo 2 por sesión

Botón/código igual para todos. Quien pulsa: +4 Semillas. El profesor ve respondieron / no. Puede marcar `left_early`; **el Pulso no marca ausencias solo.** Sin ranking de velocidad.

`LiveRound`: `sessionId`, `type` (`kickoff` \| `pulse`), `status` (`open` \| `closed` \| `cancelled`), `prompt`, `options`, `correctIndex`, `openedAt`, `closesAt`, `responses[]`.

## 6. Retos y tablero

Semana natural (lun–dom, zona del servidor). Un reto de grupo y, si el profesor quiere, uno individual por curso.

**Racha de la semana (individual).** 4 días lectivos con asistencia válida (o todos, si hay menos de 4). `excused` no suma ni falla. Si no puede llegar al objetivo: se cierra **pausado**, sin Semillas y sin “has perdido” (“Esta semana Tempito descansó.”). Premio: 25 Semillas + 15 energía.

**El aula en forma (grupo).** El 80 % del curso tiene asistencia válida en ≥ 80 % de las sesiones. `excused` sale del denominador. Cumplido: 15 Semillas cada uno y fondo parque. Si no: el reto se va el lunes, sin recado de derrota.

Días sin sesión no suman ni rompen. No hay retos de alumnos ni “no llegar tarde nunca”.

**Tablero (opt-in, apagable):** un curso, una semana; apodo, Arranques, Semillas de la semana, racha. Orden: Semillas, empate por racha. El alumno se oculta y sigue jugando. Nunca: ausencias, energía, forma, nombres legales.

## 7. Pantallas

| Rol | Pantalla | Acciones |
| --- | -------- | -------- |
| Alumno | Tempito, Juegos, Tablero, Hoy | Equipar, ocultarse, responder, “estoy aquí” |
| Profesor | Sesión, Juegos, Retos, Tablero | Abrir/cerrar, corregir, `excused`, lanzar/cancelar, on/off retos y tablero |
| Admin | Juegos, Cursos | Interruptores por curso; CRUD mínimo de curso/alumnos |

Si hay ronda `open`, Juegos tiene prioridad. Economía fija en código: no hay diseñador de juegos. Notificaciones solo in-app: ronda lanzada, evolución, racha 3/7/10, reto de grupo cumplido.

## 8. Datos y stack

```
User            id, name, nickname, role, passwordHash
Course          id, name, tempitoEnabled, liveGamesEnabled, boardEnabled, challengesEnabled
Enrollment      userId, courseId
Session         id, courseId, startsAt, status
Attendance      sessionId, userId, status, source   # kickoff | manual | here
Tempito         userId, energy, streak, care, seeds, stage, mood, equippedItemIds
TempitoItem     id, slug, name, cost
TempitoInventory userId, itemId, acquiredAt
LiveRound       id, sessionId, type, status, prompt, options, correctIndex, openedAt, closesAt
LiveResponse    roundId, userId, answer, createdAt
Challenge       id, courseId, type, weekStart, target, status
ChallengeProgress challengeId, userId, value, status
Notification    id, userId, type, payload, readAt, createdAt
```

Una web, tres roles. React + Vite + TS + Tailwind + React Router. Express + Prisma + PostgreSQL. Socket.IO. JWT + bcrypt. Tempito en SVG (o un círculo con ojos). Hosting gratuito (Pages + Render). Sin Clerk, OpenAI, Unity ni Rive.

## 9. Fases

**A — el proyecto:** auth y roles; curso/sesión/asistencia; Tempito completo (descanso por `excused`); Arranque en vivo; 3 ítems; reto individual; pantallas alumno y profesor.

**B — si hay tiempo:** Pulso, reto de grupo, tablero, interruptores admin, baraja reutilizable.

**Fuera:** QR, videollamadas, IA, blockchain, justificantes con archivo, desktop, más géneros de juego, ranking global.

## 10. Hecho

Cerrado: dos juegos (`LiveRound`); Tempito con 4 formas y 4 ánimos; `excused` congela y descansa; tablero semanal opt-in; premio = cosmética.

El recorte está hecho cuando el profesor abre sesión, lanza un Arranque, los alumnos responden en el mismo minuto, Tempito cambia al cerrar, y una falta justificada **no** deja la mascota peor.
