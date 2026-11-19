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

1. En **Personas**, pulsa **Invitar persona** y completa el nombre y el correo. Selecciona **Profesor** para ver el interruptor **También es administrador**. Actívalo si necesita ese rol y pulsa **Preparar invitación**. La fila muestra **Administrador y profesor** e **Invitación pendiente**. Puedes quitar y volver a dar ese rol desde **Editar**.
2. En **Cursos**, pulsa **Crear curso**. Pon un nombre, selecciona profesor y alumnos y guarda. Puedes seleccionar las personas que acabas de invitar, conservando su estado pendiente.
3. Abre el curso y pulsa **Programar sesión**. Selecciona fecha, inicio, fin y aula. El fin debe ser posterior al inicio en el mismo día.
4. Abre la sesión. Debe mostrar el profesor del curso y su alumnado, con la asistencia pendiente.
5. Para probar **Mis clases**, crea un curso cuyo profesor sea Miguel Rodríguez, el administrador docente del seed. Ahí solo aparecen sus cursos y los detalles son de lectura.

### Sesiones semanales

La creación semanal está implementada en #139 / PR #140 y verificada con la batería completa de 111 pruebas. Para probarla:

1. Desde un curso, abrir **Programar sesión**. En **Repetición**, elegir **Semanal**; **Una sesión** conserva la creación individual. Introducir **Fecha inicial** 2026-11-02 y **Fecha final (incluida)** 2026-11-11, marcar **Lunes** y **Miércoles** y completar horario y aula compartidos.
2. Comprobar **Vista previa**: cuatro coincidencias, cuatro por crear y cero ya existentes en un curso sin esas sesiones. Muestra primera y última fecha; **Ver fechas** despliega 2, 4, 9 y 11 de noviembre. **Guardar sesiones** cierra el formulario y muestra el listado del curso con las cantidades creadas y omitidas.
3. Repetir el lote, también cambiando el aula: las coincidencias por curso/fecha/inicio/fin se omiten. Si todas existen, el formulario permanece abierto con **Nada nuevo** y no guarda.
4. Cancelar, seleccionar un rango sin coincidencias o días vacíos, invertir el rango o superar 366 ocurrencias candidatas: no debe escribirse ninguna sesión. Las fechas deben ser reales y el fin posterior al inicio del mismo día.
5. Editar o eliminar una ocurrencia y comprobar que las demás permanecen. Conservar la creación de una sesión única y su edición. Probar teclado, móvil y ambos temas.

Las fechas del rango son inclusivas y se calculan sin cambios por zona horaria o DST. Cada ocurrencia funciona como una sesión independiente; el límite de 366 se aplica antes de omitir duplicados. La batería Playwright siguiente pasó 111/111 en 40,5 s (85 pruebas del store y 26 de navegador; 46 nuevas y 65 anteriores). También pasó el build de `web/`. La evidencia y el alcance de las comprobaciones están en [admin-prototype.md](../docs/admin-prototype.md#verificación-fresca-de-recurrencia--139--pr-140). La revisión de concepto pasó sin discrepancias y las cuatro pruebas focales de capturas pasaron tras ajustar su posición inicial; se revisaron móvil claro y escritorio oscuro.

### Editar y eliminar

- En **Personas**, **Editar** abre el mismo formulario con los datos actuales y **Guardar cambios** conserva el identificador y el estado de la cuenta. En tu propia fila, el aviso bajo el nombre explica por qué solo aparece **Editar**. Puedes cambiar el nombre y el correo de tu cuenta.
- Para eliminar un profesor asignado, edita antes sus cursos y selecciona otro profesor. Eliminar un alumno lo retira también de los cursos donde estaba matriculado. Cambiar un rol se rechaza mientras deje asignaciones incompatibles.
- Abre un curso para **Editar curso** o **Eliminar curso**. Editar permite cambiar nombre, profesor y alumnado. Eliminar pide confirmación e indica cuántas sesiones programadas se borrarán con el curso; las personas permanecen.
- Abre una sesión para **Editar sesión** o **Eliminar sesión**. Editar permite cambiar fecha, horario y aula, manteniendo su curso. Eliminar esa sesión conserva el curso y su alumnado.
- **Cancelar** una edición o confirmación conserva los datos. Los listados de las sesiones programadas reflejan los cambios del curso. **Mis clases** sigue siendo de lectura.

La evidencia histórica de la ampliación CRUD es: batería completa 65/65 y comprobación focal 3/3 tras el último ajuste del texto de confirmación. La secuencia y el alcance de estas comprobaciones están en [admin-prototype.md](../docs/admin-prototype.md#verificación-y-runbook-local).

El tema claro/oscuro se cambia desde la cabecera. **Cerrar sesión** vuelve a la entrada de la demo; los datos continúan en memoria mientras no recargues. Recargar el navegador restaura los datos iniciales y exige abrir de nuevo la demo. Entrar o salir de administración no cambia las cuentas ni la sesión del alumno. Para parar Vite, usa **Ctrl+C** en su terminal.

El panel guarda las invitaciones pendientes en la demo web. La activación y la creación de contraseña se prueban con una invitación de ejemplo en [el PR #130 de Electron](https://github.com/venturars/aTempo/pull/130). El envío de correo y la conexión entre ambas demos están pendientes. Consulta el alcance en [admin-prototype.md](../docs/admin-prototype.md).

## Probar al alumno

Con el mismo servidor en marcha, abre <http://localhost:5191/>. La cuenta pública de ejemplo es `ada.lopez@clase.test` / `clase-2026`. La sesión, las cuentas, las entradas y los avisos se guardan en `localStorage`, así que siguen al abrir el enlace del QR en una pestaña nueva.

Para registrar asistencia, abre **Hoy → Abrir lista** en [el Electron del PR #130](https://github.com/venturars/aTempo/pull/130). Escanea su QR o escribe en la web las seis cifras que aparecen debajo. Ambos cambian cada 30 segundos. Consulta los pasos para probar con un móvil en [el PR #123](https://github.com/venturars/aTempo/pull/123).

Para volver a probar el recorrido en desarrollo, abre http://localhost:5191/?reiniciar. Restablece la demo en este navegador y abre el inicio del alumno.

## Comprobar los cambios

Desde `web/`, `pnpm build` comprueba los tipos y genera `dist/`. Las pruebas focales de administración viven en `desktop/tests/` y reutilizan el Playwright ya instalado. Desde la raíz, con las dependencias nativas de `desktop/` instaladas:

```sh
cd desktop
pnpm exec playwright test --config playwright.admin.config.ts --workers=1 --retries=0 --update-snapshots=none
```

La configuración sirve y cierra su propio Vite en el puerto 5193; no necesita que abras el servidor de desarrollo del puerto 5191.
