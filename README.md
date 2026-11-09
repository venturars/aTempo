# aTempo

**Documento de Constitución · Versión 0.1**

Marco de referencia para la definición y desarrollo del producto.

---

## 1. Propósito del documento

Este documento establece la visión, el alcance inicial, los usuarios, la estructura funcional y las decisiones de producto de aTempo. Su objetivo es servir como referencia compartida para continuar el trabajo de definición funcional, diseño y desarrollo.

La siguiente etapa recomendada es convertir esta constitución en un PRD funcional, definiendo pantalla por pantalla las acciones y reglas de cada rol, sin fijar todavía tecnologías definitivas.

## 2. Visión del producto

aTempo es una solución para visualizar, registrar y acreditar la asistencia de alumnos en clase. Busca automatizar el control de presencia, limitar la interacción humana repetitiva y reducir los errores derivados de pasar lista de forma manual o incompleta.

El producto debe ayudar a las organizaciones a controlar el cumplimiento de requisitos de asistencia, disponer de evidencias demostrables y emitir certificados con mayor confianza. También debe mejorar el tiempo efectivo de clase, reducir la mala praxis y ofrecer un registro fiable de entradas, retrasos, salidas y ausencias.

aTempo se plantea como un producto SaaS explotable económicamente, competitivo en precio y orientado a organizaciones que necesiten utilizarlo de forma recurrente.

## 3. Objetivos

- Automatizar y hacer verificable el registro de asistencia.
- Reducir el tiempo dedicado por el profesorado a pasar lista.
- Ofrecer a las organizaciones evidencias fiables para decisiones académicas y certificaciones.
- Permitir a alumnos, profesores y administradores consultar información relevante y actualizada.
- Detectar patrones de absentismo, retrasos y salidas anticipadas.
- Incorporar funcionalidades de comunicación, gamificación y ayuda contextual sin convertirlas en barreras para la experiencia principal.

## 4. Perfiles de usuario

| Perfil                           | Necesidad principal                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Administrador de la organización | Controlar asistencia, cumplimiento, cursos, profesores, alumnos, justificantes y evidencias para certificaciones.        |
| Profesor                         | Gestionar sesiones con rapidez, consultar porcentajes y estadísticas, resolver incidencias y recibir avisos de patrones. |
| Alumno                           | Registrar y defender su presencialidad, consultar puntualidad e historial y presentar justificantes.                     |
| Administrador de aTempo          | Operar el negocio SaaS: organizaciones, usuarios, suscripciones, integraciones, seguridad y soporte.                     |

## 5. Estructura de navegación

### 5.1. Administrador de la organización

| Pantalla            | Contenido                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| Dashboard           | Estadísticas globales, alertas, alumnos en riesgo y resumen de asistencia. |
| Cursos y calendario | Gestión de cursos, horarios, sesiones, profesores y alumnos.               |
| Alumnos             | Listado, detalle, asistencia, justificantes y patrones de absentismo.      |
| Profesores          | Listado, asignaciones y estadísticas de asistencia.                        |
| Juegos              | Configuración de juegos, retos y dinámicas de gamificación.                |
| Settings            | Configuración general, integraciones, notificaciones, permisos y temas.    |

Los informes y exportaciones estarán disponibles dentro de Cursos y calendario, Alumnos y Profesores, según corresponda.

### 5.2. Profesor — aplicación de escritorio

| Pantalla                    | Contenido                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| Dashboard                   | Próximas clases, sesiones activas, registro de asistencia y alertas predictivas. |
| Incidencias y justificantes | Retrasos, ausencias, salidas anticipadas y gestión de justificantes.             |
| Estadísticas                | Asistencia por curso, evolución y patrones de alumnos.                           |
| Juegos                      | Juegos interactivos y seguimiento de participación.                              |
| Settings                    | Preferencias, integraciones y notificaciones.                                    |

El chatbot estará disponible desde todas las pantallas.

### 5.3. Alumno — aplicación web

| Pantalla      | Contenido                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------- |
| Dashboard     | Registrar asistencia, avisar de retrasos o ausencias, próxima clase y resumen de asistencia. |
| Mis cursos    | Cursos matriculados, calendario e historial.                                                 |
| Justificantes | Enviar documentación y consultar solicitudes.                                                |
| Tempito       | Mascota virtual, rachas, evolución y recompensas.                                            |
| Juegos        | Participación en actividades interactivas.                                                   |
| Settings      | Perfil, preferencias, notificaciones y temas.                                                |

El chatbot también estará disponible desde todas las pantallas.

## 6. Funcionalidades transversales

Las siguientes funcionalidades no tendrán necesariamente una pantalla propia:

| Funcionalidad              | Dónde aparece                              |
| -------------------------- | ------------------------------------------ |
| Chatbot IA con RAG         | Todas las pantallas.                       |
| Predicciones de asistencia | Dashboard, alumnos, cursos y estadísticas. |
| Centro de notificaciones   | Settings y avisos contextuales.            |
| Integraciones              | Settings.                                  |
| Temas de colores           | Settings.                                  |
| Auditoría y blockchain     | Cursos, alumnos, sesiones y exportaciones. |

## 7. Funcionalidades principales

### 7.1. Integraciones externas

Las integraciones se incorporarán progresivamente, aunque se contemplan desde el inicio del producto. Plataformas previstas:

- Google Meet
- Microsoft Teams
- Zoom
- Slack
- Gmail
- Outlook
- Discord
- Telegram

### 7.2. Centro de notificaciones

- Inicio de clase retrasado.
- Clase cancelada.
- Alumno que comunica que llegará tarde.
- Alumno que avisa de que no asistirá.
- Justificantes recibidos.
- Alertas de absentismo recurrente.
- Avisos de sesiones pendientes.
- Notificaciones de juegos y rachas.

### 7.3. Inteligencia artificial

- Chatbot con RAG sobre la documentación y datos autorizados de aTempo.
- Respuestas adaptadas al rol del usuario.
- Predicciones de patrones de asistencia.
- Aprendizaje y mejora mediante feedback de las respuestas.

### 7.4. Gamificación

- Pantallas de juegos interactivos de asistencia.
- Sistema de retos y recompensas.
- Tipos de juegos pendientes de definir.
- Posibilidad de competiciones entre alumnos.

### 7.5. Temas visuales

- Temas de colores.
- Modo claro y oscuro.
- Personalización de la apariencia.
- Preferencias por usuario.

## 8. Tempito — mascota virtual

Tempito será la mascota virtual de cada alumno. Su estado evolucionará según el comportamiento de asistencia:

- Asistir mantiene su energía y bienestar.
- Mantener rachas permite evolucionar.
- Faltar puede afectar a su estado.
- Los retos permiten conseguir recompensas.
- Las reglas deberán evitar penalizar injustamente las ausencias justificadas.

## 9. Predicciones de asistencia

Las predicciones se distribuirán en las pantallas donde aporten valor; no constituirán una sección independiente. Deben avisar al profesor cuando se detecten patrones, por ejemplo: un alumno ha faltado cuatro de los últimos cinco jueves y tiene una próxima sesión el jueves a las 09:00. El aviso debe indicar riesgo de ausencia recurrente para permitir una anticipación, no aplicar sanciones automáticas.

## 10. Arquitectura conceptual

| Componente                            | Responsabilidad                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Administración web                    | Gestión de organización, cursos, calendario, alumnos, profesores, configuraciones y evidencias.    |
| Aplicación de escritorio del profesor | Operación ágil de sesiones, registro de asistencia, incidencias y consulta de estadísticas.        |
| Portal web del alumno                 | Registro de presencia, consulta de historial, avisos, justificantes, juegos y Tempito.             |
| Servicios de producto                 | Reglas de asistencia, notificaciones, integraciones, generación de exportaciones y auditoría.      |
| Datos y evidencias                    | Registro de asistencia, trazabilidad de cambios, metadatos y mecanismos de integridad verificable. |
| IA                                    | RAG limitado a información del sistema y datos autorizados, con mejora mediante feedback.          |

## 11. Seguridad y principios de confianza

- El registro de asistencia debe dejar evidencia de entrada, permanencia y salida cuando corresponda.
- Registrar una acción no equivale por sí solo a demostrar presencia durante toda la sesión.
- Las correcciones deben conservar un historial de auditoría: quién, cuándo y por qué.
- El alumno puede solicitar una corrección, pero no modificar directamente el registro original.
- Los informes y exportaciones deben poder incluir identificadores, periodo, fecha de generación, versión, hash de integridad e identificador de quien los genera.
- Los patrones de asistencia son informativos y deben revisarse por personas; no deben convertirse automáticamente en sanciones.

## 12. Decisiones de producto consolidadas

- No habrá una pantalla independiente de Informes; sus responsabilidades se repartirán en el resto de pantallas.
- Cursos y calendario se agrupan en una única área.
- Configuración, integraciones y notificaciones se agrupan en Settings.
- Incidencias y justificantes se agrupan para el profesor.
- El chatbot es transversal para todos los usuarios.
- Las predicciones se incorporan de forma contextual en otras pantallas.
- Para el alumno, registrar asistencia y avisar al profesor forman parte del Dashboard.
- Perfil y notificaciones del alumno se gestionan desde Settings.
- Los juegos de asistencia estarán presentes en la estructura, con tipos concretos pendientes de definición.

## 13. Decisiones pendientes

- Definir los mecanismos concretos de asistencia: QR, comprobaciones periódicas e integraciones con videoconferencia.
- Definir si el cumplimiento se calcula por horas, por sesiones o con ambos criterios.
- Definir el nivel de certificación requerido: registro auditable o certificación criptográfica avanzada.
- Definir los tipos de juegos y sus reglas.
- Definir las reglas de Tempito y el tratamiento de ausencias justificadas.
- Detallar las acciones, permisos y reglas de cada pantalla en el PRD funcional.

## 14. Próximo paso

Usar este documento como fuente de verdad para desarrollar el PRD funcional de aTempo, pantalla por pantalla, definiendo funcionalidades exactas, acciones por rol y reglas de negocio antes de elegir tecnologías definitivas.

## 15. Sistema visual

No cambia las secciones 1 a 14.

La app todavía no está empezada. El sistema visual queda en el repositorio antes de la primera pantalla, para que lo que se construya después sea igual. El aspecto está en `packages/design-system`. Quien construya una feature sigue `AGENTS.md`.

Hay dos temas. La app abre en oscuro índigo. El otro es el claro índigo. En Settings, cada usuario elige. Si no hay elección, sigue en oscuro.

El significado de un estado no cambia con el tema. Presente es verde, retraso es ámbar, ausente es rojo, salida es azul y pendiente es neutro. El color va siempre con texto.

La interfaz sigue tres referencias, sin copiarlas enteras:

- [Heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/): la persona ve qué pasa, el texto es el suyo, puede salir de una acción, lo igual se comporta igual y no hace falta recordar lo que se puede mostrar. Se evita el error y, si ocurre, se entiende cómo seguir. Cada pantalla enseña solo lo que hace falta.
- [Principios de accesibilidad del W3C](https://www.w3.org/WAI/fundamentals/accessibility-principles/): se puede percibir, usar y entender, también con teclado y con un lector de pantalla.
- [Laws of UX](https://lawsofux.com/): pocas opciones a la vez, y lo importante está cerca y se reconoce sin explicación.

Un ejemplo de la guía no es una decisión. La navegación sigue en la sección 5, las integraciones en la 7.1 y el mecanismo de asistencia sigue abierto.
