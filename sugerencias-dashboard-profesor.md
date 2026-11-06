# Sugerencias: Dashboard del profesor

Propuesta para organizar el Dashboard de la aplicación de escritorio del profesor (sección 5.2 del README) y explicar de dónde sale la información de cada bloque.

Todo lo que aparece aquí es una propuesta para revisar en equipo. Los nombres y datos de los ejemplos son ficticios, y los umbrales son valores iniciales que habrá que validar.

## 1. Objetivo de la pantalla

El profesor suele consultar el Dashboard con la clase a punto de empezar o ya en marcha. Por eso la pantalla debe responder rápido a tres preguntas:

1. ¿Qué sesión tengo ahora y quién está?
2. ¿Qué clases vienen después?
3. ¿Hay algo que deba revisar?

## 2. Organización de la pantalla

```text
┌──────────────────────────────────────────────────────────────┐
│ aTempo                                     🔔 3     👤       │
├───────────────────────────────┬──────────────────────────────┤
│ 1. SESIÓN ACTIVA / PRÓXIMA    │ 3. ALERTAS PREDICTIVAS       │
│  Bases de datos · 09:00-11:00 │  ⚠ Ana suele llegar unos     │
│  Presentes 20 (2 tarde)       │    30 min tarde los jueves   │
│  Pendientes 4                 │    (5 de las últimas 6)      │
│  [Abrir sesión] [Mostrar QR]  │  ⚠ Luis faltó 4 de los       │
│  [Cerrar sesión]              │    últimos 5 jueves          │
│                               │  [Ver evidencia] [Revisada]  │
│  Lista en vivo:               ├──────────────────────────────┤
│   ✓ Ana     09:02             │ 4. AVISOS E INCIDENCIAS      │
│   ⏰ Luis    09:35            │  · Marta: mañana llegará     │
│   – Marta   Pendiente         │    20 min tarde              │
├───────────────────────────────┤  · 2 justificantes           │
│ 2. PRÓXIMAS CLASES            │  · 1 corrección solicitada   │
│  Hoy 12:00    Redes · Aula 2  │  [Ir a Incidencias]          │
│  Mañana 09:00 BBDD · Aula 3   │                              │
│  Vie 10:00   Redes (cancelada)│                              │
│  [Avisar retraso]             │                              │
│  [Cancelar clase]             │                              │
└───────────────────────────────┴──────────────────────────────┘
                                              💬 Chatbot
```

La sesión activa ocupa el mayor espacio porque es la tarea principal. Las alertas quedan al lado para verlas sin tapar la lista. El bloque de avisos e incidencias muestra los avisos de los alumnos y un resumen que lleva a la pantalla de incidencias. El chatbot está disponible como pide la sección 5.2.

## 3. Qué hay detrás de cada bloque

| Bloque | Fuente de los datos | Quién los crea | Cuándo se actualiza |
| --- | --- | --- | --- |
| Sesión activa / próxima | Sesión y registros de asistencia | Administrador (sesión), alumno y profesor (registros) | Con cada registro |
| Próximas clases | Sesiones asignadas al profesor | Administrador, en Cursos y calendario; el profesor puede cancelarlas o avisar de un retraso | Al cambiar el calendario |
| Alertas predictivas | Historial de sesiones cerradas | Cálculo automático | Al cerrar una sesión |
| Avisos e incidencias | Avisos, justificantes y solicitudes de corrección | Alumno | Con cada aviso, solicitud o resolución |

### 3.1. Sesión activa / próxima

Muestra la sesión en curso o, si no hay ninguna, la siguiente. Una sesión pasa por estos estados: programada, abierta, cerrada o cancelada.

- **Al abrir la sesión**, cada alumno matriculado empieza en `Pendiente`.
- **Durante la clase**, los registros actualizan la lista en vivo y los contadores.
- **Al cerrar la sesión**, quien siga en `Pendiente` pasa a `Ausente`. Así no se marca a nadie como ausente antes de tiempo.
- **Si se aprueba un justificante**, esa sesión pasa a contar como ausencia justificada y deja de contar como ausencia.
- **Después del cierre**, cualquier cambio se hace como corrección y conserva quién, cuándo y por qué (sección 11 del README).

### 3.2. Próximas clases

El Dashboard no guarda una copia de los horarios. Consulta las sesiones del profesor en una ventana de tiempo, por ejemplo 7 días, ordenadas por fecha.

La fuente de verdad es Cursos y calendario. Si el administrador cancela o retrasa una clase, el cambio aparece aquí y se genera la notificación correspondiente (sección 7.2 del README).

**Cancelar una clase:** el profesor elige una próxima clase, pulsa `Cancelar clase` e indica el motivo.

- La sesión pasa a `cancelada` en Cursos y calendario.
- Los alumnos matriculados reciben una notificación.
- La sesión no cuenta para la asistencia ni para las alertas.
- Queda guardado quién la canceló, cuándo y por qué.

**Avisar de un retraso:** el profesor elige una próxima clase, pulsa `Avisar retraso` e indica los minutos. Por ejemplo: "Hoy empezaré 15 minutos tarde".

- Los alumnos matriculados reciben una notificación.
- La clase no cambia: el horario sigue igual en Cursos y calendario.
- En esa sesión, los retrasos de los alumnos se miden desde la hora avisada. Así nadie aparece como retrasado por esperar al profesor.

### 3.3. Alertas predictivas

Proponemos empezar con reglas fijas, sin aprendizaje automático. Son viables para el equipo, se pueden probar con datos inventados y cada alerta se explica sola. Un modelo necesitaría datos reales que todavía no existen.

**Cómo se genera una alerta:**

1. Al cerrar una sesión, se toma el historial de cada alumno en ese curso.
2. Se agrupan las sesiones por franja: mismo día de la semana y misma hora de inicio.
3. Se aplican las reglas sobre las últimas sesiones de la franja.
4. Se descartan los casos que no tienen datos suficientes.
5. La alerta se muestra solo si el alumno tiene una próxima sesión en esa franja.

**Reglas de la primera versión:**

| Patrón | Regla inicial | Mensaje |
| --- | --- | --- |
| Retraso habitual | Retraso de 15 min o más en al menos 4 de las últimas 6 sesiones | "Suele llegar unos X min tarde los jueves" |
| Ausencia recurrente | `Ausente` en al menos 4 de las últimas 5 sesiones | "Faltó 4 de los últimos 5 jueves" |

X es la mediana de los retrasos que cumplen la regla. Se usa la mediana porque un único retraso muy largo no la distorsiona.

**Datos que no cuentan:**

- Ausencias justificadas, con el justificante aprobado o pendiente de revisión.
- Sesiones canceladas.
- Franjas con menos sesiones cerradas de las que pide la regla.

**Ejemplo:** Ana tiene retrasos de 28, 31, 35, 0, 30 y 32 minutos en sus últimas 6 sesiones de los jueves a las 09:00. Llega 15 minutos tarde o más en 5 de 6, así que cumple la regla. La mediana de esos 5 retrasos es 31 minutos, y el mensaje dice "unos 30 min".

**Principios:**

- **Informativa:** una alerta nunca aplica una sanción (secciones 9 y 11 del README).
- **Explicable:** "Ver evidencia" muestra las sesiones que la originaron.
- **Revisada por personas:** el profesor la marca como revisada o descartada. En esta versión, eso solo cambia su estado. Los umbrales se ajustan a mano.

La salida anticipada podría añadirse como tercera regla en una versión posterior.

### 3.4. Avisos e incidencias

**Avisos del alumno:** desde su Dashboard, el alumno puede avisar con antelación de que llegará tarde o de que no asistirá. Por ejemplo: "Mañana llegaré 20 minutos tarde". El aviso indica la sesión y, si es un retraso, los minutos previstos.

- El profesor lo ve en este bloque hasta que termina esa sesión.
- Es solo informativo: no cambia el registro de asistencia ni sustituye a un justificante.

**Incidencias:** es un contador de justificantes en `Pendiente de revisión` y de solicitudes de corrección sin resolver. El detalle y las acciones están en la pantalla Incidencias y justificantes.

## 4. Decisiones que necesita este Dashboard

Estos puntos de la sección 13 del README afectan a la pantalla.

### 4.1. Registro por QR

El registro por QR ya está decidido por el equipo. En el Dashboard aparece como la acción `Mostrar QR` del bloque de sesión activa.

### 4.2. Cumplimiento por sesiones

Proponemos calcular la asistencia por sesiones, sin contar minutos. Si el alumno ha estado en la sesión, cuenta como presente, aunque haya llegado tarde.

- **Fórmula:** sesiones con presencia / (sesiones cerradas − ausencias justificadas).
- **Ausencias justificadas:** no cuentan como ausencias, así que no reducen el porcentaje.
- **Ejemplo:** de 20 sesiones cerradas, un alumno tiene 2 ausencias justificadas y asiste a 16. Su asistencia es 16 de 18, un 89 %.
- **Hora de entrada:** se guarda para detectar retrasos habituales, pero no afecta al porcentaje.
