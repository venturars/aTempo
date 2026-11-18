# Web de aTempo

El portal del alumno y la demo de administración comparten este paquete. Importan `docs/storybook/src/system.css` y usan daisyUI y el control de tema compartido de `src/shared/ThemeToggle.tsx`. Se abren en el navegador, separados de Electron.

## Probar administración

Con Node 24 y pnpm 10.33.0, desde la raíz de esta copia:

```sh
cd web
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Abre <http://localhost:5191/admin> y pulsa **Abrir demo de administración**. No hay credenciales que introducir. Aparece el inicio de la organización Neoland, con **Personas**, **Cursos** y **Mis clases**. El administrador de ejemplo también es profesor.

1. En **Personas**, pulsa **Invitar persona**. Escribe nombre, correo y rol, y pulsa **Preparar invitación**. La persona aparece con invitación pendiente; no se envía ningún email ni se activa su cuenta.
2. En **Cursos**, pulsa **Crear curso**. Pon un nombre, selecciona profesor y alumnos y guarda. Puedes seleccionar las personas que acabas de invitar, conservando su estado pendiente.
3. Abre el curso y pulsa **Programar sesión**. Selecciona fecha, inicio, fin y aula. El fin debe ser posterior al inicio en el mismo día.
4. Abre la sesión. Debe mostrar el profesor del curso y su alumnado, con la asistencia pendiente.
5. Para probar **Mis clases**, crea un curso cuyo profesor sea Miguel Rodríguez, el administrador docente del seed. Ahí solo aparecen sus cursos y los detalles son de lectura.

### Editar y eliminar

- En **Personas**, cada fila ofrece **Editar** y **Eliminar**. Editar abre el mismo formulario con los datos actuales; **Guardar cambios** conserva el identificador y el estado de la cuenta. La cuenta admin permite editar nombre/correo, muestra sus roles actuales en solo lectura y no puede eliminarse a sí misma.
- Para eliminar un profesor asignado, edita antes sus cursos y selecciona otro profesor. Eliminar un alumno lo retira también de los cursos donde estaba matriculado. Cambiar un rol se rechaza mientras deje asignaciones incompatibles.
- Abre un curso para **Editar curso** o **Eliminar curso**. Editar permite cambiar nombre, profesor y alumnado. Eliminar pide confirmación e indica cuántas sesiones programadas se borrarán con el curso; las personas permanecen.
- Abre una sesión para **Editar sesión** o **Eliminar sesión**. Editar permite cambiar fecha, horario y aula, manteniendo su curso. Eliminar esa sesión conserva el curso y su alumnado.
- **Cancelar** una edición o confirmación conserva los datos. Los listados de las sesiones programadas reflejan los cambios del curso. **Mis clases** sigue siendo de lectura.

La ampliación CRUD está verificada en local: batería completa 65/65 y comprobación focal 3/3 tras el último ajuste del texto de confirmación. La secuencia y el alcance de estas comprobaciones están en [admin-prototype.md](../docs/admin-prototype.md#verificación-y-runbook-local).

El tema claro/oscuro se cambia desde la cabecera. **Cerrar sesión** vuelve a la entrada de la demo; los datos continúan en memoria mientras no recargues. Recargar el navegador restaura los datos iniciales y exige abrir de nuevo la demo. Entrar o salir de administración no cambia las cuentas ni la sesión del alumno. Para parar Vite, usa **Ctrl+C** en su terminal.

La demo es local y no está conectada al registro de organizaciones, la activación de invitaciones de #130 ni las APIs de persistencia. El alcance y las dependencias están en [admin-prototype.md](../docs/admin-prototype.md).

## Probar al alumno

Con el mismo servidor en marcha, abre <http://localhost:5191/>. La cuenta pública de ejemplo es `ada.lopez@clase.test` / `clase-2026`.

En Registrar asistencia, el QR de la clase de ejemplo es `ATEMPO-CLASE-1109` y el código de 6 cifras es `482913`.

Para volver a probar el recorrido en desarrollo, abre http://localhost:5191/?reiniciar. Borra las entradas y los avisos de esa pestaña, entra con la cuenta de ejemplo y abre el inicio del alumno.

## Comprobar los cambios

Desde `web/`, `pnpm build` comprueba los tipos y genera `dist/`. Las pruebas focales de administración viven en `desktop/tests/` y reutilizan el Playwright ya instalado. Desde la raíz, con las dependencias nativas de `desktop/` instaladas:

```sh
cd desktop
pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none
```

La configuración sirve y cierra su propio Vite en el puerto 5193; no necesita que abras el servidor de desarrollo del puerto 5191.
