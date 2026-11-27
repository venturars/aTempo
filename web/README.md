# Web de aTempo

El portal del alumno y el panel de administración comparten este paquete. Importan `docs/storybook/src/system.css` y usan daisyUI y el control de tema compartido de `src/shared/ThemeToggle.tsx`. La web requiere Auth0 y el router; autentica en `/api/auth/login`, `/api/auth/me`, `/api/auth/refresh` y `/api/auth/logout`. Los tokens viven en cookies `HttpOnly`.

## Iniciar la web

Con Node 24 y pnpm 10.33.0, desde la raíz:

```sh
pnpm run atempo
```

El comando instala las dependencias de `web/` y `desktop/` si faltan, arranca en el proyecto Compose `atempo` el router, las tres APIs de persistencia, PostgreSQL, RustFS y Datasette, sirve Vite en `http://localhost:5191` y abre Electron. Vite reenvía `/api/*` al mismo router quitando el prefijo `/api`. Los servicios Docker siguen activos al cerrar Electron. Para usar otro puerto de router, `pnpm run atempo --port 3005`. Para depurar solo la web, `pnpm run atempo --router-only` y en otra terminal `pnpm --dir web dev`.

Auth0 debe estar configurado y disponible para entrar en la web. `profesor@atempo.test` corresponde a Ventura Rodríguez, administrador y profesor del seed; `ada.lopez@clase.test` corresponde a Ada, alumna. Las contraseñas se gestionan en Auth0 y no se guardan en el navegador.

Si arrancas el router aislado con `pnpm run atempo --router-only --port 3005`, pasa el mismo puerto a la web: `$env:ATEMPO_API_ROUTER_PORT='3005'; pnpm --dir web dev` en PowerShell, o `ATEMPO_API_ROUTER_PORT=3005 pnpm --dir web dev` en macOS/Linux.

## Probar administración

Abre <http://localhost:5191/admin> e inicia sesión como `profesor@atempo.test`. El panel incluye **Personas**, **Cursos** y **Mis clases**. En **Personas**, **Invitar persona** permite preparar una invitación pendiente para los datos de demostración. La activación de invitaciones y **Crear cuenta** están deshabilitados; no se envía correo ni se crea una cuenta web.

1. En **Personas**, pulsa **Invitar persona**. Mientras rellenas el formulario la tabla se oculta. Pide los campos de `person`: nombre, apellidos, documento de identidad, correo y, si quieres, fecha de nacimiento y teléfono. Elige **Alumno** o **Profesor** y pulsa **Preparar invitación**. La fila muestra el documento e **Invitación pendiente**. El documento y el correo no se pueden repetir en la organización.
2. Solo hay un admin por organización. Con **Editar** en tu propia cuenta decides con **También soy profesor** si también das clase; no puedes dejarlo mientras tengas cursos.
3. En **Cursos**, pulsa **Crear curso**. Añade nombre, profesor y alumnos, y guarda.
4. Abre el curso y pulsa **Programar sesión**. Selecciona fecha, inicio, fin y aula. El fin debe ser posterior al inicio en el mismo día.
5. Abre la sesión para ver el profesor, el alumnado y la asistencia pendiente.
6. Para probar **Mis clases**, asigna el curso a Ventura Rodríguez. Esa vista muestra sus cursos en modo lectura.

### Sesiones semanales

1. Desde un curso, abre **Programar sesión**. En **Repetición**, elige **Semanal**; **Una sesión** conserva la creación individual. Introduce fecha inicial y final inclusiva, marca días y completa horario y aula compartidos.
2. Comprueba la vista previa y guarda las coincidencias. Las sesiones duplicadas por curso, fecha e intervalo se omiten.
3. Cancela, selecciona un rango sin coincidencias, días vacíos, un rango invertido o más de 366 ocurrencias candidatas: no se escribe ninguna sesión.
4. Edita o elimina una ocurrencia y comprueba que las demás permanecen.

Las fechas del rango son inclusivas y se calculan sin cambios por zona horaria o DST. Cada ocurrencia es una sesión independiente y el límite de 366 se aplica antes de omitir duplicados.

### Editar y eliminar

- **Editar** una persona conserva su identificador y estado. Eliminar un alumno lo retira también de los cursos donde estaba matriculado; para eliminar un profesor asignado, reasigna antes sus cursos.
- Editar un curso permite cambiar nombre, profesor y alumnado. Eliminarlo pide confirmación y elimina sus sesiones programadas; las personas permanecen.
- Editar una sesión permite cambiar fecha, horario y aula. Eliminarla conserva el curso y su alumnado.
- **Cancelar** conserva los datos. **Mis clases** sigue siendo de lectura.

Los datos administrativos de esta demo vuelven al seed al recargar el navegador. Las cookies `atempo_access` y `atempo_refresh` son `HttpOnly`, `SameSite=Lax`, tienen `Path=/` y no llevan `Max-Age`. El JavaScript no las lee; al recargar, la web llama a `/api/auth/me` y, si hace falta, a `/api/auth/refresh`. **Cerrar sesión** revoca el refresh y borra las cookies.

## Probar al alumno

Con Vite y el router en marcha, abre <http://localhost:5191/> e inicia sesión con Auth0 como `ada.lopez@clase.test`. El registro abierto y la activación de invitaciones están deshabilitados. Las invitaciones pendientes son datos de demostración y no habilitan una cuenta ni envían correo.

El historial y los avisos de alumno de la demo permanecen en el almacenamiento local del navegador. `/?reiniciar` limpia esos datos locales y abre el inicio del alumno; para cerrar también la sesión Auth0, usa **Cerrar sesión**.

Para registrar asistencia, abre **Hoy → Abrir lista** en Electron. Escanea su QR o escribe en la web las seis cifras que aparecen debajo. Ambos cambian cada 30 segundos. Consulta los pasos para probar con un móvil en [el PR #123](https://github.com/venturars/aTempo/pull/123).

La entrada del alumno queda en el almacenamiento local de su navegador. No aparece en la lista del profesor de Electron, que conserva sus datos simulados por separado.

## Probar el historial y las rutas del alumno

Sin sesión, abrir una pantalla privada del alumno devuelve al login Auth0. El enlace de registro de asistencia por QR pide iniciar sesión antes de guardar la entrada.

Con sesión iniciada y el servidor de desarrollo en marcha, abre estas rutas a 390 px en ambos temas:

- `/student/history?fixture=carga` muestra el estado de carga.
- `/student/history?fixture=vacio` muestra el historial vacío y los totales de una cuenta sin clases.
- `/student/history?fixture=error` muestra un error de carga. **Reintentar** vuelve al historial de la cuenta.

Los fixtures solo funcionan en desarrollo y no cambian las clases ni los avisos guardados. El historial sin parámetros muestra los datos de la cuenta.

## Comprobar los cambios

Desde `web/`, `pnpm build` comprueba los tipos y genera `dist/`. Las pruebas focales de administración viven en `desktop/tests/` y reutilizan Playwright. Desde la raíz, con las dependencias nativas de `desktop/` instaladas:

```sh
cd desktop
pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none
```

La configuración sirve y cierra su propio Vite en el puerto 5193; no necesita que abras el servidor de desarrollo del puerto 5191.
