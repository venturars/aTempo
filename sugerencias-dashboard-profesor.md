# Sugerencias: Dashboard del profesor

Propuesta para organizar el Dashboard de la aplicación de escritorio del profesor (sección 5.2 del README) y explicar de dónde sale la información de cada bloque.

Todo lo que aparece aquí es una propuesta para revisar en equipo. Los nombres y datos de los ejemplos son ficticios, y los umbrales son valores iniciales que habrá que validar.

**Relación con otras propuestas:** los estados de asistencia y de justificantes son los que propone el PR #1, todavía sin aprobar. Si cambian, habrá que actualizar este documento.

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
│  Presentes 18 · Retrasos 2    │    30 min tarde los jueves   │
│  Pendientes 4                 │    (5 de las últimas 6)      │
│  [Abrir sesión] [Mostrar QR]  │  ⚠ Luis faltó 4 de los       │
│  [Cerrar sesión]              │    últimos 5 jueves          │
│                               │  [Ver evidencia] [Revisada]  │
│  Lista en vivo:               ├──────────────────────────────┤
│   ✓ Ana     09:02             │ 4. INCIDENCIAS PENDIENTES    │
│   ⏰ Luis    09:35            │  · 2 justificantes           │
│   – Marta   Pendiente         │  · 1 corrección solicitada   │
├───────────────────────────────┤  [Ir a Incidencias]          │
│ 2. PRÓXIMAS CLASES            │                              │
│  Hoy 12:00    Redes · Aula 2  │                              │
│  Mañana 09:00 BBDD · Aula 3   │                              │
│  Vie 10:00    Redes (cancelada)│                             │
└───────────────────────────────┴──────────────────────────────┘
                                              💬 Chatbot
```

La sesión activa ocupa el mayor espacio porque es la tarea principal. Las alertas quedan al lado para verlas sin tapar la lista. Las incidencias son solo un resumen que lleva a su pantalla. El chatbot está disponible como pide la sección 5.2.

## 3. Qué hay detrás de cada bloque

| Bloque | Fuente de los datos | Quién los crea | Cuándo se actualiza |
| --- | --- | --- | --- |
| Sesión activa / próxima | Sesión y registros de asistencia | Administrador (sesión), alumno y profesor (registros) | Con cada registro |
| Próximas clases | Sesiones asignadas al profesor | Administrador, en Cursos y calendario | Al cambiar el calendario |
| Alertas predictivas | Historial de sesiones cerradas | Cálculo automático | Al cerrar una sesión |
| Incidencias pendientes | Justificantes y solicitudes de corrección | Alumno | Con cada solicitud o resolución |

### 3.1. Sesión activa / próxima

Muestra la sesión en curso o, si no hay ninguna, la siguiente. Una sesión pasa por estos estados: programada, abierta, cerrada o cancelada.

- **Al abrir la sesión**, cada alumno matriculado empieza en `Pendiente`.
- **Durante la clase**, los registros actualizan la lista en vivo y los contadores.
- **Al cerrar la sesión**, quien siga en `Pendiente` pasa a `Ausente`. Así no se marca a nadie como ausente antes de tiempo.
- **Después del cierre**, cualquier cambio se hace como corrección y conserva quién, cuándo y por qué (sección 11 del README).

### 3.2. Próximas clases

El Dashboard no guarda una copia de los horarios. Consulta las sesiones del profesor en una ventana de tiempo, por ejemplo 7 días, ordenadas por fecha.

La fuente de verdad es Cursos y calendario. Si el administrador cancela o retrasa una clase, el cambio aparece aquí y se genera la notificación correspondiente (sección 7.2 del README). El profesor solo consulta estos datos.

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

- Ausencias con justificante aprobado o pendiente de revisión.
- Sesiones canceladas.
- Franjas con menos sesiones cerradas de las que pide la regla.

**Ejemplo:** Ana tiene retrasos de 28, 31, 35, 0, 30 y 32 minutos en sus últimas 6 sesiones de los jueves a las 09:00. Llega 15 minutos tarde o más en 5 de 6, así que cumple la regla. La mediana de esos 5 retrasos es 31 minutos, y el mensaje dice "unos 30 min".

**Principios:**

- **Informativa:** una alerta nunca aplica una sanción (secciones 9 y 11 del README).
- **Explicable:** "Ver evidencia" muestra las sesiones que la originaron.
- **Revisada por personas:** el profesor la marca como revisada o descartada. En esta versión, eso solo cambia su estado. Los umbrales se ajustan a mano.

La salida anticipada podría añadirse como tercera regla en una versión posterior.

### 3.4. Incidencias pendientes

Es un contador de justificantes en `Pendiente de revisión` y de solicitudes de corrección sin resolver. El detalle y las acciones están en la pantalla Incidencias y justificantes.

## 4. Decisiones que necesita este Dashboard

Estas propuestas responden a puntos de la sección 13 del README que afectan a la pantalla.

### 4.1. Registro por QR rotativo

1. El profesor abre la sesión y su aplicación muestra un QR que cambia cada 30 segundos.
2. El alumno lo escanea desde el portal, con su sesión iniciada, y se registra su entrada.
3. Al final de la clase, el profesor muestra el QR de salida.
4. Si un alumno no puede escanear, el profesor lo registra a mano indicando el motivo.

El QR de salida es necesario porque registrar la entrada no demuestra la presencia durante toda la sesión (sección 11 del README).

**Limitación:** el QR rotativo dificulta reutilizar una foto antigua, pero un alumno presente aún podría enviarlo en directo a otra persona. Por eso debe presentarse como registro auditable, no como prueba absoluta. En clases online es menos fiable.

### 4.2. Cumplimiento por horas

Proponemos guardar los minutos reales y calcular el cumplimiento por horas, porque una sesión con 30 minutos de retraso no debería contar igual que una completa. El número de sesiones se muestra como dato adicional.

- **Minutos asistidos:** desde la entrada hasta la salida, dentro del horario de la clase.
- **Ejemplo:** en una clase de 09:00 a 11:00, entrar a las 09:30 y salir a las 11:00 son 90 de 120 minutos, un 75 %.
- **Sin QR de salida:** se crea una incidencia para que la resuelva el profesor.

## 5. Preguntas para el equipo

1. ¿Cuántos minutos de retraso se toleran antes de pasar a `Retraso`? El PR #1 también lo deja pendiente.
2. ¿Las ausencias justificadas restan de las horas exigidas o solo se muestran aparte?
3. ¿Son adecuados los umbrales iniciales de las alertas?
4. ¿Debe funcionar el QR igual en clases online o necesitan otro mecanismo hasta tener integraciones?
