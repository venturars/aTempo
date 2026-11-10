# La torre de hoy

## Idea

Una construcción cooperativa para acompañar el inicio de clase. Cada entrada
confirmada coloca una plataforma sobre la anterior. La torre crece con el grupo,
con colores que evolucionan y una nota de piano cada vez más aguda por pieza.
Al completarse, la vista se aleja y comienza una celebración de fuegos artificiales
con un «yeaaah» sintetizado. El sonido se puede silenciar.

## Recorrido

1. El profesor muestra la torre de la sesión en la pantalla de clase.
2. El alumno registra su entrada con el mecanismo de asistencia que se acuerde.
3. Una entrada confirmada añade una pieza; repetirla no añade otra.
4. El alumno ve la confirmación y el profesor ve crecer la torre común.
5. Al completarse el grupo previsto, se reproduce la celebración una sola vez.

La torre representa entradas confirmadas; no acredita permanencia ni modifica
las reglas de asistencia. La pantalla común muestra el progreso del grupo,
sin nombres ni una clasificación de alumnos.

## Boceto para revisar con compañeros

Descargar [index.html](../../design/class-tower/index.html) y abrirlo en Chrome.
No requiere instalación ni servidor.

- En Profesor, pulsar Simular otra entrada para añadir una de las seis personas.
- En Alumno, elegir una persona y registrar su entrada. Las dos vistas comparten
  el estado de esta página; repetir una persona no coloca otra pieza.
- Completar las seis entradas para ver el alejamiento y los fuegos automáticos.
- Sonido permite silenciar el piano y la celebración. El navegador activa el
  audio tras la primera interacción.
- Reiniciar demo vacía la torre y cancela los fuegos pendientes o activos.

La animación de plataformas respeta movimiento reducido. En este boceto, los
fuegos se reproducen automáticamente también con esa preferencia, por elección
de la propuesta; el comportamiento accesible final se acordará antes de integrar.

HTML, CSS, JavaScript, SVG y Web Audio propios. Datos ficticios en memoria en una
sola página: no hay conexión entre dispositivos ni registros de asistencia reales.

## Por acordar con Ventura y el equipo

- Qué participantes cuentan para completar la torre y cómo tratar ausencias
  justificadas o cambios de grupo sin señalar ni penalizar públicamente a nadie.
- Cómo recibe la pantalla la entrada ya confirmada por el sistema de asistencia.
- Qué mostrar cuando termina la sesión sin completar la torre.
- Dónde encaja en Juegos y cómo coordinarla con las propuestas #12 y #13.
- Si el sonido estará activado inicialmente y cómo permitir detener o reducir
  la celebración sin perder la confirmación de asistencia.

## Primera tarea propuesta

Una vez elegido el concepto, definir con Ventura una primera tarjeta para la vista
de la torre con entradas simuladas: progreso, una pieza por persona, final y reinicio.
La conexión al registro real y la sincronización entre dispositivos necesitarán
sus propias reglas y criterios. Esta PR propone la idea y el boceto para discutirlos.
