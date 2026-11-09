# Propuesta: revisión de correcciones de asistencia

Miguel Rodríguez · 10 de noviembre de 2026.

## Problema

Un alumno puede aparecer como ausente o con retraso y solicitar una corrección.
El profesor necesita entender qué pide y por qué, conservando el registro
original y dejando constancia de la decisión.

## Pantalla

Dentro de Incidencias y justificantes del profesor, se propone una lista de
solicitudes y el detalle de la elegida:

- Alumno y sesión.
- Registro original y corrección solicitada.
- Motivo aportado por el alumno.
- Acciones Aceptar corrección y Rechazar solicitud.
- Filtros Pendientes y Resueltas.

Al resolver se conservan el registro original, la petición, la decisión, su
motivo, el autor y la fecha. El boceto representa estos datos con ejemplos.

## Decisiones propuestas para discutir

1. ¿Resuelve el profesor asignado a la sesión o interviene un administrador?
2. ¿Es obligatorio explicar el motivo tanto al aceptar como al rechazar?
3. ¿Qué evidencia necesita el profesor antes de aceptar una corrección?

El boceto representa una posible respuesta: el profesor decide, ambas acciones
requieren un motivo y aceptar cambia el estado efectivo, manteniendo visible el
original. Son propuestas para validar con el equipo y Ventura.

Una corrección del registro y la valoración de un justificante son procesos
distintos. Esta pantalla no fija fórmulas, umbrales ni efectos académicos de
una ausencia justificada.

## Boceto y revisión

Abrir [index.html](../../design/attendance-review/index.html) en el navegador.
Desde GitHub se puede descargar el HTML con el botón de descarga del archivo;
no necesita instalar paquetes ni arrancar un servidor.

Los datos son ficticios y las acciones ocurren en memoria. Recargar restaura
las tres solicitudes iniciales.

1. Elegir cada alumno y comprobar que cambia el detalle.
2. Aceptar con un motivo y consultar el resultado en Resueltas.
3. Rechazar otra solicitud y comprobar que conserva el estado original.
4. Cancelar una decisión y comprobar que sigue pendiente.
5. Intentar confirmar sin motivo o con espacios: no debe resolverse.
6. Usar Estados para revisar vacío, carga y error con reintento.
7. Revisar con teclado y en una ventana estrecha.

En escritorio hay dos columnas; en móvil, la lista aparece encima del detalle.
El diálogo recibe el foco y permite cancelar con Escape. El resultado usa una
región de estado.

## Encaje en aTempo

La propuesta desarrolla la pantalla del profesor descrita en las secciones 5.2
y 11 del README: incidencias, solicitudes del alumno e historial de correcciones.

Complementa el ciclo de sesión de [#7](https://github.com/venturars/aTempo/pull/7)
y la consulta del alumno de [#11](https://github.com/venturars/aTempo/pull/11).
No modifica el login ni el marco de escritorio de
[#6](https://github.com/venturars/aTempo/pull/6).

Los colores neutros son un wireframe; el sistema visual de
[#17](https://github.com/venturars/aTempo/pull/17) sigue en revisión.
La implementación se definiría en una tarjeta con Ventura tras validar el flujo.

## Comprobaciones del boceto

Probado con Playwright en Chrome real a 1440×960 y 390×844: selección,
aceptación, rechazo, motivo obligatorio, cancelación, conservación del original,
estados de vacío/carga/error/reintento y foco del diálogo. Sin errores de página
ni desbordamiento horizontal.

La revisión de compañeros y las decisiones de Ventura siguen pendientes.
