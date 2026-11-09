# Propuesta: resumen visual de asistencia del alumno

## Objetivo

Permitir que el alumno entienda su asistencia a un curso y los registros que explican el resultado, sin tener que interpretar un porcentaje aislado. Esta propuesta describe la consulta visual de datos existentes; está pendiente de revisión por el equipo.

## Ubicación en la app

En la aplicación web del alumno, dentro de **Mis cursos**, al seleccionar un curso matriculado se accede a su resumen de asistencia, calendario e historial, de acuerdo con la sección 5.3 del README. La consulta se limita a los datos del propio alumno en ese curso.

## Información visible

### Resumen del curso

- Nombre del curso y periodo al que corresponde el resumen.
- Porcentaje de asistencia, cuando pueda calcularse con la regla acordada para ese curso.
- Datos que explican el resultado: cantidades utilizadas como numerador y denominador, su significado y unidad (sesiones u horas, según lo acordado), y registros incluidos o excluidos con su motivo. Los recuentos por estado se presentan como contexto, sin equipararlos automáticamente a unidades computables.
- Explicación breve de la regla aplicada y del tratamiento acordado para retrasos, salidas anticipadas y justificantes. La vista utiliza el mismo criterio que el resto del curso; no establece una fórmula propia.
- Mínimo de asistencia requerido, solo cuando esté definido para el curso. Si falta, se indica «Mínimo de asistencia no definido», sin asumir un valor.
- Aviso «Hay justificantes o correcciones pendientes que podrían modificar este resultado» cuando existan solicitudes pendientes que puedan afectarlo. Se permite consultar las sesiones implicadas y se identifica el resultado como provisional, sin anticipar la resolución.

Si no hay sesiones, se muestra «Este curso todavía no tiene sesiones». Si las hay pero faltan datos suficientes, se muestra «Todavía no hay datos suficientes para calcular la asistencia». Si falta acordar la regla, se indica «Cálculo de asistencia pendiente de definición». En estos casos no se muestra un porcentaje ficticio ni se interpreta la falta de datos como ausencia.

### Calendario mensual

Un calendario sencillo permite recorrer los meses del curso. Cada sesión se identifica con un símbolo y una etiqueta de texto, acompañados por un color. La leyenda permanece disponible para entender los registros sin depender del color.

Se propone esta representación visual, sujeta al diseño final y a los estados que acuerde el equipo:

| Registro | Símbolo | Color propuesto | Etiqueta |
| --- | --- | --- | --- |
| Asistencia | ✓ | Verde | Presente |
| Retraso | R | Ámbar | Retraso |
| Ausencia | × | Rojo | Ausente |
| Salida anticipada | S | Violeta | Salida anticipada |
| Registro pendiente | ? | Gris | Pendiente |

Los símbolos son recursos de presentación, no nuevos estados académicos. Si hay varias sesiones en una fecha, se muestran sus indicadores por separado y el número de sesiones; no se asigna un único estado al día. Las sesiones programadas, abiertas o canceladas se identifican con su situación de sesión, separada de la asistencia del alumno, sin convertirlas visualmente en ausencias. Un día sin sesiones queda identificado como tal.

### Detalle de una fecha

Al seleccionar una fecha se listan todas sus sesiones, ordenadas por horario. Para cada una se muestra:

- Identificación de la sesión, horario previsto y situación de la sesión.
- Estado de asistencia del alumno y horas de entrada y salida, cuando estén registradas. Los datos que falten se indican como no disponibles.
- Participación de ese registro en el resumen, conforme a la regla acordada.
- Situación del justificante en un campo independiente: no presentado, pendiente de revisión, aprobado o rechazado, conforme al ciclo que se acuerde. El justificante no sustituye la etiqueta del estado de asistencia ni implica por sí mismo una regla de cómputo.
- Correcciones pendientes o resueltas que estén disponibles para consulta, sin editar el registro original desde esta vista.

## Interacción básica

1. El alumno entra en **Mis cursos** y selecciona un curso.
2. Consulta el resumen del curso y la leyenda del calendario.
3. Cambia de mes para explorar su historial. El cambio de mes afecta al calendario; el periodo del resumen sigue indicado explícitamente.
4. Selecciona una fecha para consultar cada sesión, incluso si sus estados son distintos. Si no hay sesiones, ve «No hay sesiones en esta fecha».
5. Desde un justificante puede acceder a su consulta en **Justificantes**, manteniendo allí el envío y seguimiento de documentación.

La navegación por meses y fechas debe poder usarse con teclado y ofrecer etiquetas comprensibles para lectores de pantalla.

## Relación con las reglas del curso

Esta consulta utiliza los estados de asistencia, el ciclo de sesiones y las reglas de cálculo que acuerde el equipo. Su aportación se centra en explicar visualmente al alumno sus registros en **Mis cursos**, sin redefinir esas reglas ni asumir que las decisiones pendientes estén aprobadas.

## Alcance

La aportación añade únicamente este documento y conserva el README y los documentos existentes. Describe cómo explicar visualmente los datos disponibles; no implementa código, pantallas, gráficos ni una base de datos, y no añade dependencias.

No define fórmulas, umbrales ni reglas académicas. Quedan fuera las predicciones, la gamificación y el cálculo de cuántas clases habría que asistir para alcanzar el mínimo. No se incluyen cifras de ejemplo ni se presuponen decisiones pendientes.

## Criterios de aceptación

- Al elegir un curso en **Mis cursos**, el alumno puede consultar únicamente su asistencia de ese curso.
- Todo porcentaje visible identifica su periodo, regla acordada, unidad y datos que lo explican; no se calcula con un criterio alternativo para esta vista.
- El mínimo se muestra cuando está definido y se informa de su ausencia cuando no lo está.
- El calendario distingue presencia, retraso, ausencia y salida anticipada mediante símbolos, texto y colores, con una leyenda accesible.
- Una fecha con varias sesiones permite consultar todas por separado sin perder sus diferencias. Una fecha sin sesiones lo comunica claramente.
- El estado del justificante y la situación de la sesión se distinguen del estado de asistencia del alumno.
- Los justificantes o correcciones pendientes que puedan afectar al resultado generan un aviso de provisionalidad y permiten identificar las sesiones afectadas.
- La falta de sesiones, datos suficientes o regla acordada genera el mensaje correspondiente, sin mostrar un porcentaje engañoso ni asignar ausencias por falta de información.
- La vista solo consulta los registros; la gestión de justificantes y correcciones conserva sus flujos y permisos existentes.

## Decisiones pendientes

- Acordar el cálculo por sesiones, horas o ambos, el periodo computable y el tratamiento de sesiones según su ciclo de vida.
- Acordar el efecto de retrasos, salidas anticipadas y justificantes, incluidos los pendientes, sobre los datos del cálculo. No se presupone su inclusión ni exclusión.
- Confirmar los estados definitivos de asistencia y justificantes, y cómo se informa de sus correcciones.
- Determinar quién define el mínimo de cada curso y dónde se configura, sin establecer aquí ningún valor.
- Concretar símbolos, colores y presentación de varias sesiones por día, manteniendo texto, leyenda y accesibilidad.

La consulta utilizará estas reglas cuando estén acordadas; mientras falten, mostrará los registros disponibles y explicará por qué no puede ofrecer un resultado definitivo.
