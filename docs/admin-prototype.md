# Administración de organización — prototipo web

Fecha: 2026-11-18. Estado: implementación, revisión y verificación local completas; commit y publicación separados.

## Issue preparada

**Tipo:** feat. **Título:** Manage organisation people, courses and sessions in the admin prototype.

Como administrador de una organización, quiero invitar a profesores y alumnos, asignarlos a un curso y programar sus sesiones, para preparar el listado que después usa el profesor al pasar lista.

Esta tarea amplía la administración funcional. #66 sigue siendo la alineación visual del resumen antiguo de Electron; no cubre estas acciones. El resumen de Electron se conserva como referencia y no se presenta como una administración conectada.

## Spec

### Resultado

El recorrido verificable es **invitar a una persona → crear un curso → asignar profesor y alumnos → programar una sesión → consultar su listado**. Todo funciona con datos de ejemplo en el paquete `web/`, bajo `/admin`, sin crear otra aplicación ni otro tema.

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
5. Documentar cómo abrir esta copia y los resultados. Preparar issue/PR con dependencias claras; publicación separada del trabajo local.

## Aceptación y pruebas

- **Recorrido completo:** crear invitaciones de profesor y alumno, crear un curso, asignarlos y crear su sesión; el detalle muestra exactamente sus nombres y el alumnado pendiente.
- **Administrador docente:** asignar al admin como profesor y comprobar que Mis clases solo muestra sus cursos; volver conserva los cambios.
- **Errores sin escrituras:** duplicado de email con mayúsculas/espacios, IDs/roles inválidos, matrícula repetida, fecha imposible y fin anterior/igual al inicio no crean personas/cursos/sesiones.
- **Navegación:** cancelar formularios no guarda; volver conserva los datos durante el arranque; salir requiere abrir la demo otra vez; recargar restaura seed.
- **Aislamiento:** abrir/cerrar la demo admin no inicia, cierra ni modifica la sesión/cuentas del alumno.
- **Diseño:** 390 px y escritorio, temas claro/oscuro, formularios con etiquetas, navegación con teclado y sin desbordamiento horizontal de página; las tablas pueden desplazarse dentro de su contenedor.
- **Regresión:** login y dashboard del alumno, tema y cierre de sesión conservan el comportamiento de PR #123. Build/typecheck de `web/` y pruebas focales pasan sin modificar snapshots existentes.

Usar el Playwright instalado en el repositorio para pruebas de lógica y navegador; no añadir otro framework. Las pruebas y servidores deben cerrarse al terminar. No se declara aceptación hasta registrar sus comandos y resultados.

## Tasks

- [x] TASK-01 — concept-developer: delimitar el alcance y fijar referencias/dependencias. Preparación confirmó guía generada (79 páginas) y `guide:check` correctos; instalación web con lockfile congelado correcta.
- [x] TASK-02 — code-developer: modelos/store mock con validación y seed.
- [x] TASK-03 — code-developer: rutas y pantallas admin con componentes reutilizados.
- [x] TASK-04 — code-tester: lógica, recorrido navegador y regresiones focales. Repetición final 43/43 correcta tras el ajuste visual del profesor invitado.
- [x] TASK-05 — concept-tester: comprobar diseño, documentación y coherencia con la spec. Revisión sin bloqueos; aclaración upstream de SDK corregida.
- [x] TASK-06 — concept-developer: registrar instrucciones y evidencia de verificación.
- [x] TASK-07 — create-commit: guardar el trabajo verificado en un commit local.
- [ ] Publicación — create-pr: crear la issue/PR y publicar cuando corresponda; el cuerpo de PR está preparado abajo, sin publicar.

## Base y publicación

- Worktree: `atempo-admin`; rama local `local/admin-organisation-nov18`.
- Integración local inicial: `5ec718f717eb660b5073cc571b16fee51a3baa11`, con padres staging `cbc77cab26e885b3f03b0088ca6f9efb9c9e2cca` y PR #123 `4884154b397dd6b14595c57ec0cb8be46f8f8fbf`. No se integra PR #130.
- #113 aporta el paquete web y #123 su diseño; ambas están pendientes de merge. Una futura PR admin debe explicar esta dependencia y distinguir los cambios heredados de los propios. No publicar una comparación amplia como si todo fuera nuevo admin.
- No se han creado issue/PR, enviado revisiones ni publicado comentarios. La definición local evita notificaciones durante la construcción; al publicar, trasladar Spec/Plan/Tasks con `issue-spec` y enlazar una única issue funcional nueva.

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

Resultados comprobados el 2026-11-18:

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

## Cuerpo de PR preparado

**Título:** Add an organisation admin prototype using the shared web design.

### Por qué

El resumen antiguo de administración solo mostraba estadísticas. Ahora se puede preparar un curso desde las personas invitadas hasta la sesión y su listado, dentro de la misma web del alumno.

### Qué cambia

Área `/admin` con entrada explícita de demo, Personas, Cursos, sesiones y Mis clases para el administrador que también es profesor. Las invitaciones quedan pendientes; los cursos asignan profesor/alumnado y las sesiones muestran su listado pendiente. El store mock valida las operaciones antes de escribir. Los datos viven en memoria y vuelven al seed al recargar.

Reutiliza el tema, los campos, tablas y navegación de Meghan. El único componente visual extraído para compartir con alumno es el control de tema existente. Se conservan las sesiones del alumno y administración independientes.

### Dependencias y alcance de la comparación

La copia local combina staging `cbc77cab26e885b3f03b0088ca6f9efb9c9e2cca` con #123 `4884154b397dd6b14595c57ec0cb8be46f8f8fbf`, que hereda #113. El paquete web, su rediseño de alumno y los cambios de Storybook son heredados; los cambios propios son admin, la extracción del control de tema, las rutas generadas, sus pruebas e instrucciones.

Publicar hacia staging cuando #113 y #123 estén integradas. Si se publica antes, expresar la dependencia apilada y revisar la base/comparación para que no parezca que esta PR vuelve a entregar todo el sitio del alumno. No integra #130 ni crea APIs administrativas, email real o activación de cuentas. La issue funcional nueva se enlazará al publicar; #66 conserva su alcance visual.

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

El recorrido detallado y los comandos de verificación están en [web/README.md](../web/README.md#probar-administración). La evidencia automatizada final está en el apartado anterior. No se ha creado ni publicado esta PR.
