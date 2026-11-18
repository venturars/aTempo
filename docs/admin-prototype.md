# Administración de organización — prototipo web

Fecha: 2026-11-18. Estado: CRUD publicado en la [PR #140](https://github.com/venturars/aTempo/pull/140), vinculado a [#139](https://github.com/venturars/aTempo/issues/139). La ampliación de sesiones semanales está implementada y verificada con 111/111 pruebas frescas en esa misma entrega; la revisión de concepto pasó sin discrepancias. Destino `staging`; revisores `venturars` y `Elladeyavorsky`.

## Alcance local

**Tipo:** feat. **Título:** Manage organisation people, courses and sessions in the admin prototype.

Como administrador de una organización, quiero invitar a profesores y alumnos, asignarlos a un curso y programar sus sesiones, para preparar el listado que después usa el profesor al pasar lista.

Esta tarea amplía la administración funcional. #66 sigue siendo la alineación visual del resumen antiguo de Electron; no cubre estas acciones. El resumen de Electron se conserva como referencia y no se presenta como una administración conectada.

## Spec

### Resultado

El recorrido verificable es **invitar a una persona → crear un curso → asignar profesor y alumnos → programar una sesión → consultar y editar los datos → eliminarlos sin dejar referencias rotas**. Personas, cursos y sesiones deben permitir crear, consultar, editar y eliminar. Todo funciona con datos de ejemplo en el paquete `web/`, bajo `/admin`, sin crear otra aplicación ni otro tema.

### Comportamiento

- La entrada `/admin` ofrece abrir explícitamente la demo de administración. No pide ni almacena contraseñas. No sustituye al registro/login real de la organización.
- La demo tiene una sola organización y un administrador con `roles: ['admin', 'teacher']`. Se usan identificadores estables para personas, cursos y sesiones; los nombres no son claves.
- **Personas:** muestra profesores y alumnos, su rol y su estado activo o invitación pendiente. Invitar pide nombre, correo y rol profesor/alumno; crea una persona pendiente. La interfaz confirma que la invitación quedó preparada, sin afirmar que se envió un email. Las cuentas activas pertenecen al seed; la activación de invitaciones es trabajo de #129/#130 y no se duplica aquí.
- **Cursos:** permite crear un curso con nombre, un profesor de la organización y alumnos de la organización. El administrador que también es profesor aparece entre los profesores elegibles. Los alumnos no pueden recibir roles de profesor/admin. La selección de alumnos no contiene duplicados.
- Preparar un curso puede incluir personas con invitación pendiente. Se conserva y muestra su estado; asignarlas no activa su cuenta. Esta es una decisión del prototipo que habrá que confirmar al definir el contrato de administración.
- **Sesiones:** desde un curso se crea una sesión con fecha, hora inicial, hora final y aula. La hora final debe ser posterior a la inicial en ese mismo día. Se muestra como programada; todavía no se abre ni se pasa lista desde administración.
- **Listado de sesión:** deriva las personas matriculadas del curso, muestra el profesor asignado y las entradas como pendientes, sin inventar llegadas, ausencias o registros históricos.
- **Mis clases:** el administrador/profesor puede cambiar a una vista de lectura de sus propios cursos y sesiones y volver a administración. Reutiliza el detalle/listado anterior y no reproduce el panel de asistencia de Electron. Un curso de otro profesor no aparece en esa vista.
- Cambiar tema usa el comportamiento y los tokens existentes. Salir cierra solo la sesión demo de administrador y vuelve a su entrada. Recargar restaura el seed y exige abrir de nuevo la demo; no se alteran las cuentas/sesión del alumno.

### Ampliación CRUD local

- **Editar personas:** reutilizar el formulario de invitación con nombre, correo y rol actuales. Mantener el ID y el estado activo/pendiente. El correo sigue siendo único dentro de la organización, excluyendo a la persona editada. Las cuentas admin permiten editar nombre/correo y conservan exactamente sus roles: el campo de solo lectura muestra Administrador o Administrador y profesor según corresponda. No se añade promoción de administradores. Cambiar profesor/alumno se rechaza si deja asignaciones incompatibles: primero hay que reasignar sus cursos o retirar sus matrículas.
- **Eliminar personas:** pedir confirmación con el nombre y el efecto. Eliminar un alumno lo retira de todos los cursos de la organización en la misma operación. Un profesor asignado no se elimina hasta reasignar sus cursos. La cuenta administradora actual no puede eliminarse a sí misma. Cancelar la confirmación no cambia nada.
- **Editar cursos:** reutilizar el formulario de creación con nombre, profesor y alumnado actuales. Conservar el ID y sus sesiones. El cambio de alumnado/profesor se refleja en los listados de sus sesiones programadas; esta demo no contiene sesiones cerradas ni histórico de asistencia.
- **Eliminar cursos:** la confirmación identifica el curso y cuántas sesiones programadas se eliminarán con él. Al confirmar, borrar curso y esas sesiones de forma atómica. No eliminar personas. Volver a la lista de cursos; un enlace antiguo muestra el estado de elemento no disponible.
- **Editar sesiones:** reutilizar el formulario de programación con fecha, inicio, fin y aula actuales. Conservar ID y curso; aplicar las mismas validaciones de fecha/horas/aula que al crear. No se añade traslado entre cursos.
- **Eliminar sesiones:** confirmar nombre del curso y fecha; borrar solo esa sesión y volver a su curso. Sus personas y el curso permanecen.
- Todas las acciones de actualización y borrado validan identidad admin, organización, IDs y relaciones en el store. IDs desconocidos o de otra organización, datos inválidos y acciones sin sesión se rechazan sin escrituras parciales. Los IDs nuevos no reutilizan los de elementos borrados durante el mismo arranque.
- Los formularios de edición están precargados; cancelar no guarda. Las confirmaciones tienen acciones explícitas para cancelar y eliminar. `Mis clases` continúa siendo de lectura y no presenta acciones CRUD.
- Se mantiene la entrada de demo y el alcance de autenticación existente. Este incremento no añade registro/login real, activación, conexión al panel Electron, email, backend ni otra SDK.

El mock conserva sus métodos de creación y añade `updatePerson(id, InvitePersonInput)`, `updateCourse(id, CreateCourseInput)` y `updateSession(id, CreateSessionInput)`, con el resultado tipado existente de la entidad. `deletePerson(id)`, `deleteCourse(id)` y `deleteSession(id)` devuelven `MutationResult<null>`. El formulario de sesión conserva el curso del contexto; actualizar no permite trasladarla a otro curso. Estas firmas son internas al prototipo, no endpoints acordados.

### Ampliación semanal implementada — #139 / PR #140

La comparación histórica `5ec718f717eb660b5073cc571b16fee51a3baa11...bfaaaf8` cubre el CRUD inicial; la recurrencia se revisa desde `becdb531ae1697dba01e45a5901e20cdae8708d5` hasta su HEAD final.

Desde el curso, **Programar sesión** ofrece **Repetición** con **Una sesión** o **Semanal**. Semanal pide **Fecha inicial**, **Fecha final (incluida)**, días de semana con checkboxes de lunes a domingo y hora inicial/final y aula compartidas. Ambas fechas son inclusivas. **Vista previa** muestra coincidencias, sesiones por crear y ya existentes, primera/última fecha y **Ver fechas** para desplegar todas las fechas, indicando las existentes. El máximo es 366 ocurrencias candidatas por lote, antes de descontar existentes.

Las fechas se calculan como calendario con aritmética UTC, independientes de zona horaria y cambios DST, respetando años bisiestos. Rechazar fechas imposibles, rango invertido, días inválidos o vacíos, ningún día coincidente, más de 366 candidatas y horario/aula inválidos, con generación acotada para rangos grandes.

El store revalida admin, organización, curso y todo el lote antes de guardar nuevas sesiones en una sola actualización. Un duplicado exacto tiene el mismo curso, fecha, inicio y fin; cambiar el aula no permite duplicarlo. Repetir el envío omite las existentes. Si todas existen, el formulario permanece abierto con **Nada nuevo** y no se escribe. No se añaden otras reglas de solapamientos.

Cada ocurrencia es una `ClassSession` con ID estable y único. Editar o eliminar una solo afecta a ella; no hay entidad de serie ni edición/borrado masivo. Preview y cancelar no escriben. Al pulsar **Guardar sesiones** con nuevas ocurrencias, se cierra el formulario y se muestra el listado del curso con las cantidades creadas, candidatas y omitidas, sin abrir una sesión arbitraria. Los checkboxes de días tienen etiquetas y agrupación accesible; se reutilizan el formulario y diseño compartidos, sin nuevas rutas/dependencias/tema ni backend.

La verificación fresca cubre selección semanal inclusiva, preview y cantidades, duplicados parciales/totales/aula distinta y reenvío, cancelación/atomicidad/guards, calendario DST/bisiesto en cuatro zonas, límite 366/367 y rangos grandes, creación única y edición/borrado individual. La batería completa y el build pasaron; la evidencia está en el runbook. Los resultados CRUD anteriores se conservan como historia.

### Diseño y reutilización

La referencia visual es [PR #123 de Meghan](https://github.com/venturars/aTempo/pull/123), commit [`4884154b397dd6b14595c57ec0cb8be46f8f8fbf`](https://github.com/venturars/aTempo/tree/4884154b397dd6b14595c57ec0cb8be46f8f8fbf). Se reutilizan `docs/storybook/src/system.css`, fuentes, clases daisyUI, `field`, `nav-link`, tablas, espaciado de la cabecera y el control de tema de su `StudentLayout`. El control se extrae a `web/src/shared/ThemeToggle.tsx` y se conserva su comportamiento en alumno. No se copian estilos en un tema admin ni se añade Tempito a administración. No se añaden ajustes de letter-spacing en los componentes nuevos.

### Validación y límites

- Rechazar nombre vacío, correo inválido y correo repetido tras quitar espacios laterales y normalizar mayúsculas. Rechazar IDs inexistentes, roles no elegibles, matrículas repetidas, fecha inválida y horas inválidas/invertidas. Una operación rechazada no modifica el store.
- Validar también en las acciones del mock, no solo en el formulario. Los mensajes identifican el campo y permiten corregirlo; cancelar un formulario no crea datos.
- Mantener separadas las sesiones de alumno y administración. Las acciones de gestión del mock exigen una sesión demo con rol admin; sin ella se rechazan sin escribir. Los datos demo no son un mecanismo de autorización de producción.
- El profesor controla el margen de retraso por clase, antes de empezar. Admin no añade un editor de ese margen. La hora/estado de una llegada y la auditoría pertenecen al servidor/domain, no a esta demo.
- No añadir dependencias, APIs administrativas, JWT, envío de correo, almacenamiento real, reglas blockchain, correcciones de asistencia ni pantallas de activación/registro. Conservar el trabajo local de #90 y las ramas de otros equipos.

## Plan

1. Integrar staging y la referencia exacta de Meghan en una rama/worktree local. Leer la guía generada antes de construir pantallas.
2. Crear modelos y un store mock de personas, cursos y sesiones con validación y datos coherentes. No crear un segundo store de cuentas/login del alumno.
3. Añadir el área `/admin` al router existente, reutilizar los controles visuales y construir Personas, Cursos, detalle, sesión/listado y Mis clases.
4. Verificar acciones del store, el recorrido completo, errores, cancelación, salida, aislamiento de sesión y móvil/ambos temas. Comprobar que el recorrido del alumno sigue funcionando.
5. Documentar cómo abrir esta copia, registrar verificación fresca y publicar la entrega mediante #139 y su PR hacia `staging`, con las dependencias y revisión indicadas abajo.

## Aceptación y pruebas

- **Recorrido completo:** crear invitaciones de profesor y alumno, crear un curso, asignarlos y crear su sesión; el detalle muestra exactamente sus nombres y el alumnado pendiente.
- **Administrador docente:** asignar al admin como profesor y comprobar que Mis clases solo muestra sus cursos; volver conserva los cambios.
- **Errores sin escrituras:** duplicado de email con mayúsculas/espacios, IDs/roles inválidos, matrícula repetida, fecha imposible y fin anterior/igual al inicio no crean personas/cursos/sesiones.
- **Navegación:** cancelar formularios no guarda; volver conserva los datos durante el arranque; salir requiere abrir la demo otra vez; recargar restaura seed.
- **Aislamiento:** abrir/cerrar la demo admin no inicia, cierra ni modifica la sesión/cuentas del alumno.
- **Diseño:** 390 px y escritorio, temas claro/oscuro, formularios con etiquetas, navegación con teclado y sin desbordamiento horizontal de página; las tablas pueden desplazarse dentro de su contenedor.
- **Regresión:** login y dashboard del alumno, tema y cierre de sesión conservan el comportamiento de PR #123. Build/typecheck de `web/` y pruebas focales pasan sin modificar snapshots existentes.
- **CRUD completo:** crear, consultar y editar una persona, un curso y una sesión; conservar sus IDs, mostrar los valores guardados y comprobar que cancelar la edición conserva los anteriores.
- **Relaciones al eliminar:** cancelar cada borrado no escribe; borrar alumno limpia sus matrículas; profesor asignado y autoeliminación admin se rechazan; borrar curso elimina sus sesiones y conserva personas; borrar sesión conserva el curso. Los enlaces a elementos borrados no enseñan otro elemento creado después.
- **Recurrencia semanal:** dos días por semana y rango inclusivo producen las fechas previstas, con resumen de nuevas/omitidas; crear vuelve al listado con cantidad. Repetir omite existentes, también con aula distinta; cancelar o rechazar no escribe. Una ocurrencia se edita/elimina sin alterar sus hermanas. Comprobar 366/367, fechas imposibles, DST/bisiestos, días vacíos/ajenos/sin coincidencias y guards. Verificado en la batería fresca de 111 pruebas.
- **Cambios rechazados:** correo duplicado, cambio de rol incompatible, profesor/alumnado no elegibles, fecha/horas inválidas, IDs extranjeros/desconocidos o sesión admin cerrada no cambian el estado.

Usar el Playwright instalado en el repositorio para pruebas de lógica y navegador; no añadir otro framework. Las pruebas y servidores deben cerrarse al terminar. No se declara aceptación hasta registrar sus comandos y resultados.

## Tasks de la base local `8223947`

- [x] TASK-01 — concept-developer: delimitar el alcance y fijar referencias/dependencias. Preparación confirmó guía generada (79 páginas) y `guide:check` correctos; instalación web con lockfile congelado correcta.
- [x] TASK-02 — code-developer: modelos/store mock con validación y seed.
- [x] TASK-03 — code-developer: rutas y pantallas admin con componentes reutilizados.
- [x] TASK-04 — code-tester: lógica, recorrido navegador y regresiones focales. Repetición final 43/43 correcta tras el ajuste visual del profesor invitado.
- [x] TASK-05 — concept-tester: comprobar diseño, documentación y coherencia con la spec. Revisión sin bloqueos; aclaración upstream de SDK corregida.
- [x] TASK-06 — concept-developer: registrar instrucciones y evidencia de verificación.
- [x] TASK-07 — create-commit: guardar el trabajo verificado en un commit local.
      La pausa de publicación de la fase local terminó con la autorización de Miguel del 2026-11-18. El seguimiento vigente está en la issue #139; estas casillas conservan la evidencia histórica de la base.

## Tasks de la ampliación CRUD

- [x] CRUD-01 — concept-developer: definir edición, borrado, relaciones y aceptación local.
- [x] CRUD-02 — code-developer: añadir acciones de actualización/borrado validadas e IDs no reutilizados.
- [x] CRUD-03 — code-developer: reutilizar formularios para editar y añadir confirmaciones de borrado en Personas, Cursos y Sesiones.
- [x] CRUD-04 — code-tester: verificar CRUD completo, cancelaciones, relaciones, errores sin escrituras y regresiones existentes.
- [x] CRUD-05 — concept-tester: contrastar implementación y documentación, incluido el alcance local. Revisión estática independiente sin bloqueos; aclarado el curso en la confirmación de borrado de sesión.
- [x] CRUD-06 — concept-developer: actualizar instrucciones y registrar evidencia de la ampliación.

## Base y publicación

- Worktree: `atempo-admin`; rama de publicación `139-feat-admin-crud`. La rama local anterior `local/admin-organisation-nov18` conserva el origen del prototipo.
- Integración local inicial: `5ec718f717eb660b5073cc571b16fee51a3baa11`, con padres staging `cbc77cab26e885b3f03b0088ca6f9efb9c9e2cca` y PR #123 `4884154b397dd6b14595c57ec0cb8be46f8f8fbf`. No se integra PR #130.
- #113 aporta el paquete web y #123 su diseño. El orden de integración es #113 → #123 → administración; el destino de la PR admin es `staging`. Su descripción debe distinguir los cambios heredados de los propios. La comparación de los dos commits admin es `5ec718f717eb660b5073cc571b16fee51a3baa11...bfaaaf8`; comparar el ancla con el HEAD de publicación incluye además la integración posterior de staging.
- La issue funcional es [#139](https://github.com/venturars/aTempo/issues/139), con Spec/Plan/Tasks gestionados por `issue-spec`. La PR debe enlazarla y solicitar revisión a `venturars` y `Elladeyavorsky` tras completar las comprobaciones. La autorización de publicación no implica que el push, la PR o las solicitudes ya hayan terminado; sus resultados se registran en la issue y la PR.

## API pendiente y coordinación

El brief `brief-api-v1.md` excluye creación de cursos, sesiones, matrículas e invitaciones de su primera entrega. El prototipo recoge las operaciones y datos necesarios, pero no fija rutas/DTOs administrativos como si ya estuvieran acordados. Se propondrán al definir esa parte con los equipos responsables.

Flujo previsto: pantalla → SDK frontend → API-router público → SDK de dominio → APIs de persistencia. La SDK frontend y la SDK de dominio tienen responsabilidades distintas. Esta demo no llama directamente a PostgreSQL/SQLite/RustFS. La activación de invitaciones de #130, los códigos de asistencia de seis cifras del brief y las reglas de backend se coordinan después; no se copian las reglas QR de cuatro cifras del prototipo del alumno.

El trabajo local de #90 sigue en su worktree/rama, sin integrarse ni descartarse. `adminStore.ts` es estado mock para este recorrido, no una SDK paralela; la futura SDK frontend debe reutilizar el trabajo de #90 al sustituir los mocks por el contrato acordado.

## Decisiones de la reunión del 18 de noviembre

Fuentes: transcripción «Clase AI Engineer», 2026-11-18, y `brief-api-v1.md` entregados por Miguel en esta conversación. El brief define el primer contrato de asistencia; esta spec concreta solo el prototipo administrativo añadido después de revisarlo.

- El primer admin registra la organización. Profesores/alumnos llegan por invitación; un admin puede ser también profesor y student va solo.
- Frontend prepara los endpoints del API-router y su SDK de consumo; las reglas reales y la persistencia se conectan desde dominio. Esta demo de administración no adelanta el contrato de esos endpoints, excluidos del brief v1.
- El margen de retraso pertenece al profesor, por clase, y no se cambia tras el inicio. No se añade su edición a admin.
- Las llegadas reales llevan hora del servidor. Las correcciones posteriores deben guardar quién, cuándo y motivo; el almacenamiento temporal/permanente no cambia esa responsabilidad ni se reproduce en estas pantallas.

## Verificación y runbook local

### Verificación fresca de recurrencia — #139 / PR #140

Resultados del 2026-11-18 sobre la implementación semanal, antes del commit final:

- Desde `desktop/`, `pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none`: **111/111 PASS en 40,5 s** (85 del store y 26 de navegador; 46 nuevas y 65 anteriores), sin actualizar snapshots. Incluye calendario UTC/DST/bisiestos en cuatro zonas mediante subprocesos, límite 366/367 y generación acotada, duplicados/reenvío, atomicidad/guards y regresiones CRUD/alumno.
- Desde `web/`, `pnpm build`: PASS, incluidos TypeScript y Vite. TypeScript estricto nativo de pruebas/configuración y ESLint nativo de pruebas: PASS.
- ESLint suplementario de los tres archivos web modificados: PASS con la configuración desktop, opciones explícitas de Prettier y `react-refresh/only-export-components` desactivada. `web/` no tiene configuración ESLint propia.
- Formato de pruebas y `git diff --check`: PASS. El intento de TypeScript/ESLint en Docker quedó bloqueado por `tsc`/`eslint` ausentes en el volumen desktop vacío; se validaron con las dependencias nativas existentes, sin instalar paquetes.
- El servidor propio de pruebas en 5193 quedó cerrado; el servidor preexistente en 5191 se conservó. La revisión de concepto pasó sin discrepancias. Tras añadir desplazamiento al inicio solo a la preparación de capturas, las cuatro pruebas focales pasaron 4/4 en 7,5 s; la batería 111/111 precede a ese ajuste de pruebas y no hubo cambios de producción posteriores. La inspección visual confirmó controles semanales y preview claros en móvil claro de 390 px y escritorio oscuro de 1280 px, con la cabecera correctamente situada. Commit y publicación de la ampliación se siguen en #139.

### Verificación fresca para #139

Comprobaciones del 2026-11-18 sobre la integración `dcce98f20db239f66b91307fe639cd9369390cf4`, antes del commit final de documentación:

- Desde `web/`, `pnpm build`: PASS, incluidos TypeScript y Vite.
- Desde `desktop/`, `pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none`: **65/65 PASS en 31,1 s** (46 del store y 19 de navegador), sin actualizar snapshots.
- TypeScript estricto de pruebas/configuración y ESLint nativo de los tres archivos desktop: PASS. Prettier sobre los cambios propios, excluidos los archivos generados: PASS.
- ESLint suplementario de web: PASS usando la configuración desktop, opciones explícitas de Prettier y `react-refresh/only-export-components` desactivada para las exportaciones de rutas TanStack y helpers. `web/` no tiene configuración ESLint propia; esta adaptación se distingue del lint nativo.
- El servidor propio de pruebas en 5193 quedó cerrado. El servidor preexistente en 5191 se conservó.

La revisión de concepto y los pasos de commit, push y revisión de PR se siguen en #139; estos resultados no afirman que esos pasos hayan terminado.

### Ampliación CRUD verificada

Comprobaciones del 2026-11-18, en este orden:

1. Tras corregir la edición de la cuenta admin y su etiqueta de rol, la batería completa pasó **65/65 en 29,1 s**: 46 pruebas del modelo y 19 de navegador. Incluye edición/borrado de personas, cursos y sesiones, sus relaciones, confirmación/cancelación, guards, aislamiento de alumno y regresiones previas.
2. Después se añadió el nombre del curso a la confirmación de borrado de sesión. Tras ese último cambio de texto pasaron **3/3 pruebas focales en 6,2 s**, con nuevas capturas de los diálogos. No se repitieron las 65 pruebas después de ese cambio de texto.
3. TypeScript estricto, ESLint focal y Prettier: PASS. El build completo de `web/`, incluido typecheck, pasó tras el ajuste del rol admin. La inspección visual comprobó edición móvil en claro y el diálogo real de borrado en oscuro.
4. La revisión estática independiente no encontró bloqueos; la aclaración menor de la confirmación quedó aplicada y probada. El servidor de pruebas en 5193 quedó cerrado.

El comando de batería completa sigue siendo `pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none`, ejecutado desde `desktop/`. Estos resultados corresponden a la fase local anterior a #139; la publicación requiere una ejecución completa nueva y su evidencia en la issue.

### Publicación y aviso de Discord

La [PR #140](https://github.com/venturars/aTempo/pull/140) está lista para revisión, enlazada a #139 (Front-End Review), con revisiones solicitadas. En `80731f8`, GitGuardian y Socket pasaron y GitHub no indicó conflictos de merge.

Los avisos de Discord de las ejecuciones `44295868056`, `44295869125` y `44295891855` fallaron después de que Discord aceptara el mensaje: el registro posterior de la notificación devolvió GitHub HTTP 403 y quedó incierto. Revisar `#git` antes de reintentar: una repetición puede duplicar mensajes ya aceptados. El origen es la acción compartida `venturars/delivery-workflow/.github/actions/discord-pr-notifications`, fijada a `9d12e301ce3ae504cb5b441c21704d9c80025251`. Los mantenedores deben investigar los permisos y la escritura de ese registro upstream; el 403 está confirmado, pero el permiso concreto que falta aún no está demostrado.

### Evidencia histórica de la base

Resultados de la base `8223947`, comprobados el 2026-11-18. Las 43 pruebas siguientes son evidencia histórica del recorrido inicial; la ampliación CRUD se verifica con los resultados nuevos del apartado anterior.

- Instalación web con `pnpm install --frozen-lockfile`: PASS.
- Guía de Storybook: 79 páginas generadas y `guide:check`: PASS.
- Desde `web/`, `pnpm build`: PASS, incluido typecheck y compilación Vite.
- Desde `desktop/`, `pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none`: repetición final 43/43 PASS en 15,9 s (31 del modelo, 12 de navegador), después de mostrar el estado pendiente del profesor en los detalles de curso/sesión. Incluye aserciones de ese estado, flujo completo, errores, sesión independiente, Mis clases, recarga, temas/móvil y regresión de alumno.
- TypeScript estricto de las pruebas, lint focal y comprobación de formato: PASS. TypeScript estricto y ESLint se comprobaron de nuevo tras el ajuste final y pasaron.
- Revisión de concepto/diseño: sin bloqueos. El cierre del servidor propio de pruebas en 5193 está confirmado.

- Ejecutar pnpm **desde `web/`** para el portal: Corepack elige la versión por el `packageManager` del directorio actual. En esta preparación, `pnpm --dir web …` desde la raíz seleccionó pnpm 12 y falló; `cd web` antes del comando usa 10.33.0 y el lockfile correcto.
- Las rutas nuevas se generan al arrancar Vite o construir con su plugin de TanStack. No editar `web/src/routeTree.gen.ts` a mano. Si TypeScript aún no reconoce una ruta recién creada, generar primero con Vite y repetir el typecheck.
- Un resultado de build o test solo se registra al terminar su proceso. Los procesos de verificación deben quedar cerrados antes de entregar.
- Corregir las responsabilidades en la documentación compartida al detectarlas: una frase antigua hacía consumir la SDK de dominio directamente desde frontend. `ARCHITECTURE.md` ahora diferencia SDK frontend → API-router → SDK de dominio; conservar esa distinción en nuevas tareas.
- En capturas de modales nativos de daisyUI, esperar que el diálogo y `.modal-box` alcancen opacidad 1 y capturar con `animations: 'disabled'`. Tener foco y dimensiones correctas no prueba que haya terminado el fundido; una captura prematura puede salir vacía.

## Referencia histórica de la PR inicial

Este texto describe la base inicial. La descripción de la PR de #139 debe incorporar también edición/borrado y las comprobaciones actuales de la ampliación CRUD, además de las dependencias siguientes.

**Título:** Add an organisation admin prototype using the shared web design.

### Por qué

El resumen antiguo de administración solo mostraba estadísticas. Ahora se puede preparar un curso desde las personas invitadas hasta la sesión y su listado, dentro de la misma web del alumno.

### Qué cambia

Área `/admin` con entrada explícita de demo, Personas, Cursos, sesiones y Mis clases para el administrador que también es profesor. Las invitaciones quedan pendientes; los cursos asignan profesor/alumnado y las sesiones muestran su listado pendiente. El store mock valida las operaciones antes de escribir. Los datos viven en memoria y vuelven al seed al recargar.

Reutiliza el tema, los campos, tablas y navegación de Meghan. El único componente visual extraído para compartir con alumno es el control de tema existente. Se conservan las sesiones del alumno y administración independientes.

### Dependencias y alcance de la comparación

La copia local combina staging `cbc77cab26e885b3f03b0088ca6f9efb9c9e2cca` con #123 `4884154b397dd6b14595c57ec0cb8be46f8f8fbf`, que hereda #113. El paquete web, su rediseño de alumno y los cambios de Storybook son heredados; los cambios propios son admin, la extracción del control de tema, las rutas generadas, sus pruebas e instrucciones.

La PR se dirige a `staging` y expresa la dependencia apilada #113 → #123 → administración mientras las anteriores estén pendientes de integración. La descripción distingue el paquete web y rediseño heredados del trabajo admin. No integra #130 ni crea APIs administrativas, email real o activación de cuentas. Se enlaza #139; #66 conserva su alcance visual.

### Cómo probarlo

Desde la raíz de la copia de esta rama, con Node 24 y pnpm 10.33.0:

```sh
cd web
pnpm install --frozen-lockfile
pnpm dev
```

Abrir <http://localhost:5191/admin> y pulsar **Abrir demo de administración**. No se introducen credenciales.

1. En Personas, preparar una invitación de profesor y otra de alumno; deben aparecer pendientes.
2. En Cursos, crear un curso y asignarle esas personas. Abrirlo y programar una sesión con fecha, inicio, fin y aula.
3. Abrir la sesión: profesor y alumnado coinciden con el curso y la asistencia está pendiente.
4. Crear un curso asignado a Miguel Rodríguez y comprobar que aparece en Mis clases; un curso de otro profesor no aparece ahí. Volver no borra los cambios.
5. Probar tema claro/oscuro, ancho móvil y cancelar un formulario. Un correo duplicado o una hora final anterior/igual al inicio muestran error sin guardar.
6. Cerrar sesión vuelve a la entrada de demo. Recargar restaura el seed. La sesión del alumno se conserva al entrar/salir del admin.

El recorrido detallado y los comandos de verificación están en [web/README.md](../web/README.md#probar-administración). La evidencia histórica está en el apartado anterior; los resultados de la verificación fresca y el estado de publicación se registran en #139 y su PR.
