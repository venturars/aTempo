# Gamificación de aTempo

Guía para el equipo.

La constitución general sigue en `README.md`. Aquí no construimos todo aTempo: ni QR, ni certificados, ni Meet, ni un chatbot. Solo la parte que se juega.

## Qué estamos haciendo

En clase, pasar lista es lento y aburrido. La idea es cambiar eso por tres cosas simples:

1. **Tempito**, una mascota que cada alumno cuida al venir a clase.
2. **Juegos cortos** que lanza el profesor (un minuto, no una partida de una hora).
3. **Retos de la semana**, para tener un objetivo entre clase y clase.

El alumno no “ficha”. Cuida de Tempito y responde una pregunta. El profesor no recorre una lista. Lanza un juego y ve quién está. Nadie cuelga un ranking de faltas en la pared.

Esto lo vamos a programar un equipo junior, sin pagar herramientas. Si una idea pide Unity, OpenAI o tres apps distintas, no entra.

## Cómo nos vamos a comportar

- **La clase manda.** Si el juego atrasa el tema del día, está mal diseñado.
- **Asistir es cuidar, no competir.** Tempito es de cada alumno. El ranking, si existe, nunca enseña quién faltó.
- **Justificar no se castiga.** Si alguien trae un justificante, Tempito no se pone triste, la racha no se rompe y el reto se pausa.
- **Un juego no es un certificado.** Responder la pregunta dice “estaba aquí”. El papel oficial de asistencia, si algún día existe, es otra cosa.
- **Tempito no pone notas.** Bajar de energía no es un apercibimiento. El profesor no evalúa con la mascota.
- **Se puede apagar.** En un curso se pueden quitar Tempito, los juegos, el tablero o los retos.

## Lo mínimo que necesitamos de “clase”

No vamos a montar el calendario de toda la academia. Nos basta con esto:

- Un **curso** (nombre, profesor, lista de alumnos).
- Una **sesión** (un día y una hora; está programada, en marcha o cerrada).
- Un **estado de asistencia** por alumno: presente, retraso, falta, o falta justificada.

Cómo se rellena en este proyecto:

1. El profesor abre la sesión.
2. El alumno entra al juego o pulsa “estoy aquí”.
3. El profesor puede corregir a mano. El alumno no reescribe su propio registro.
4. Una falta se puede marcar como justificada **sin** subir PDFs. Con un botón vale.

Con eso ya se alimentan Tempito, los juegos y los retos.

## Las cuatro cosas que mueve Tempito

No hay tienda rara ni cajas de botín. Hay cuatro números, y las **Semillas** solo sirven para vestir a Tempito. Nunca para subir nota.

**Energía (0 a 100).** Es el ánimo del día. Venir a tiempo suma 10. Jugar suma 5. Cerrar un reto suma 15. Llegar tarde resta 5. Faltar sin justificar resta 20. No baja de 0 ni pasa de 100.

**Racha.** Días de clase seguidos viniendo (aunque sea tarde). Una falta injustificada la deja en 0. Una falta justificada **la congela**: ni suma ni se rompe.

**Semillas.** Los puntos del juego. Se ganan en el Arranque, el Pulso y los retos. Se gastan en gorros, fondos y colores. Una vez comprado, el ítem es para siempre; ponérselo o quitárselo no cuesta otra vez.

**Cuidado.** Cuántos días ha venido de verdad a lo largo de su vida en aTempo. Sube 1 por día válido y **nunca baja**. Sirve para que Tempito evolucione. Las faltas justificadas no suman.

Qué cuenta como día válido: presente o retraso. La falta justificada no suma ni rompe. La injustificada rompe la racha y baja energía.

### La tienda (poca, fija)

Gorro 40, pañuelo 40, fondo del aula 60, fondo del parque 80 (o regalado si el grupo cumple el reto), color aurora 100 (o al llegar a racha 7). La corona de racha es gratis al llegar a 10 días seguidos y se cae si la racha se rompe.

## Tempito

Cada alumno tiene el suyo. El profesor y el admin no lo tocan.

Tiene dos capas. La **forma** es permanente (según el cuidado). El **ánimo** cambia con la energía.

- 0–2 días de cuidado → **Semilla**. Casi no se mueve.
- 3–6 → **Brote**.
- 7–14 → **Tempito**.
- 15 o más → **Tempo**. Ya no vuelve atrás aunque un día falte; solo se pone más triste.

Ánimo según la energía: dormido (0–19), bajo (20–39), bien (40–79), alto (80–100).

Si la última clase está justificada y todavía no ha vuelto, Tempito aparece **descansando**, con manta: “Tempito descansa. La racha está en pausa.” Eso no es un castigo. Es un descanso.

### Qué pasa al cerrar la clase

- **Presente:** +10 de energía, +1 racha, +1 cuidado.
- **Retraso:** −5 de energía, +1 racha, +1 cuidado.
- **Justificada:** no se mueve nada.
- **Falta:** −20 de energía, racha a 0.

Si hay dos clases el mismo día, racha y cuidado solo suman **una vez**. La energía sí cuenta cada clase (ir a las dos cuida más; faltar a una ya resta). Si el profesor luego cambia “falta” por “justificada” o “presente”, se recalcula ese día. Las Semillas de los juegos se dan aparte, cuando se juega.

El alumno ve a Tempito grande, las barras, el armario de ítems, los últimos 7 días en puntitos de color (verde, ámbar, gris de descanso, rojo) y el reto de la semana. El profesor solo ve la forma y la racha. Nadie más ve a Tempito triste.

Si no hay diseñador, un círculo con ojos y un color por ánimo vale. No hace falta un motor 3D.

## Los dos juegos

El profesor los lanza. Los alumnos responden a la vez. El reloj lo marca el **servidor**, no el portátil de cada uno. Hay dos, y se parecen por dentro: pregunta o botón, cuenta atrás, se acaba solo.

### Arranque (60 segundos, uno por clase)

Sustituye los primeros minutos de pasar lista. El profesor lanza una pregunta de la clase anterior: un texto y cuatro opciones. Quien responde **está presente**, acierte o falle. Fallar no es un examen: las Semillas premian el acierto; haber estado premia la presencia.

- Acierto: 10 Semillas y +5 de energía.
- Error: 6 Semillas y +5 de energía.
- No responde: nada. Tampoco se le marca falta todavía: queda pendiente. El profesor cierra la lista a mano o lanza un Pulso más tarde.

Se puede cancelar; entonces nadie cobra. El profesor puede coger una pregunta de su baraja o escribirla al momento. Si un alumno entra a los 50 segundos, juega los 10 que quedan.

### Pulso (20 segundos, como mucho dos por clase)

A mitad de clase, para ver si siguen ahí. Todos ven el mismo botón o el mismo código corto. Quien pulsa a tiempo gana 4 Semillas. El profesor ve dos columnas: respondieron / no. Puede marcar “se fue antes”, pero **el Pulso no pone faltas solo**. No hay ranking de quién fue más rápido.

## Retos y tablero

La semana va de lunes a domingo. En cada curso hay, como mucho, un reto de grupo y un reto individual. No montamos un tablón infinito de misiones.

**Racha de la semana (individual).** Venir 4 días de clase (o todos, si esa semana hay menos de 4). Un día justificado no suma ni falla. Si con los justificantes ya no puede llegar al 4, el reto se cierra en pausa: sin Semillas y sin “has perdido”. El texto es “Esta semana Tempito descansó.” Si lo cumple: 25 Semillas y +15 de energía.

**El aula en forma (grupo).** El 80 % de la clase ha venido de forma válida al menos al 80 % de las sesiones. Las justificadas no hunden al grupo: ese alumno no cuenta en contra. Si sale: 15 Semillas para cada uno y el fondo del parque. Si no sale, el lunes el reto se va. Sin mensaje de derrota.

Los días sin clase no suman ni rompen. Nadie crea retos. Tampoco hay un reto de “no llegar tarde nunca”: es demasiado duro.

**El tablero** es un ranking de la semana, de un curso, y se puede apagar. Muestra apodo, Arranques respondidos, Semillas de la semana y racha. Gana quien más Semillas tiene esa semana. El alumno puede ocultarse y seguir jugando. Nunca salen faltas, energía, la forma de Tempito ni el nombre real.

## Qué ve cada persona

**Alumno:** Tempito (equipar, ocultarse del tablero), Juegos (responder), Tablero, y Hoy (entrar a clase o pulsar “estoy aquí”). Si hay un juego en marcha, Juegos manda: hay que verlo enseguida.

**Profesor:** la sesión (abrir, cerrar, corregir, justificar), los juegos (lanzar, cancelar, escribir la pregunta), los retos y el tablero (encenderlos o apagarlos).

**Admin:** poco. Encender o apagar Tempito, juegos, tablero y retos por curso, y un alta simple de cursos y alumnos. No hay un “editor de videojuegos”. Los números de este documento van fijos en el código.

Avisos solo dentro de la app: “han lanzado un juego”, “Tempito ha evolucionado”, racha 3 / 7 / 10, “el grupo ha cumplido el reto”. Nada de email.

## Cómo lo vamos a montar

Una sola web. Tres zonas según el rol (`/student`, `/teacher`, `/admin`).

- Pantalla: React, Vite, TypeScript, Tailwind.
- API: Node, Express, PostgreSQL, Prisma.
- En vivo (Arranque y Pulso): Socket.IO.
- Login: JWT y contraseña cifrada. Sin Clerk ni Auth0.
- Dibujo: SVG, o un círculo. Sin Unity ni Rive.
- Subirlo: algo gratis (Pages + Render o similar).

En la base de datos hay que guardar, en cristiano: usuarios y apodos, cursos con interruptores, quién está en qué curso, sesiones, asistencia, el Tempito de cada uno, los ítems, las rondas de juego y las respuestas, los retos de la semana y los avisos. No hace falta memorizar los nombres de las tablas ahora. Se sacan de estas reglas cuando toque Prisma.

## Por dónde empezar

**Esto es el proyecto (Fase A):** registrarse con rol, un curso y una sesión, marcar asistencia a mano o con “estoy aquí”, Tempito de verdad (incluido el descanso justificado), el Arranque en vivo, tres ítems comprables, el reto individual, pantallas de alumno y de profesor.

**Si sobra tiempo (Fase B):** el Pulso, el reto de grupo, el tablero, los interruptores del admin, la baraja de preguntas para reutilizar.

**No entra:** QR, videollamadas, inteligencia artificial, blockchain, justificantes con archivo, app de escritorio, más tipos de juego, ranking de toda la academia.

## Cuándo está hecho

Cuando un profesor abre la clase, lanza un Arranque, los alumnos responden en ese mismo minuto, Tempito cambia al cerrar, y una falta justificada **no** deja la mascota peor de lo que estaba.

Si eso funciona, hay producto. El resto es capa.
