# Demo de aTempo

Electron conserva una demo local con cuentas y datos de ejemplo. La web de alumnado y administración requiere Auth0 y el api-router; no ofrece acceso simulado sin ellos. El panel web usa datos demo en memoria y el portal del alumno conserva su historial y avisos en el navegador.

## Arrancar

Con Node 24 y pnpm 10.33.0, desde la raíz, instala los paquetes web y desktop:

```sh
pnpm run demo:install
```

### Electron sin Auth0

En una terminal, arranca el escritorio de demo:

```sh
pnpm run demo:desktop
```

Entra con las cuentas públicas de ejemplo de Electron: `profesor@atempo.test` / `Profesor123!` o `ada.lopez@clase.test` / `clase-2026`. Las invitaciones de prueba de Electron se describen más abajo.

### Web con Auth0

Configura `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` y `AUTH0_AUDIENCE` en el `.env` de la raíz. Arranca el router en una terminal:

```sh
pnpm run atempo --router-only
```

En otra terminal, arranca Vite:

```sh
pnpm run demo:web
```

Abre <http://localhost:5191/> para el alumno y <http://localhost:5191/admin> para administración. Usa las contraseñas registradas en Auth0:

| Correo | Área de la web | Datos demo |
| --- | --- | --- |
| `ada.lopez@clase.test` | Portal del alumno | Ada López |
| `profesor@atempo.test` | Administración | Ventura Rodríguez |

El router guarda la sesión en memoria y entrega una cookie HttpOnly. La cookie no tiene Max-Age; el router expira las sesiones a los siete días. Reiniciar el router invalida las sesiones. El login web no crea cuentas. **Crear cuenta** y activar una invitación muestran un aviso de que todavía no están disponibles.

Para arrancar también Electron conectado a Auth0, ejecuta `pnpm run atempo` en vez de `--router-only`; Vite sigue arrancando con `pnpm run demo:web` en otra terminal.

## Administración web

1. Entra con `profesor@atempo.test`. Abre la organización demo Neoland como Ventura Rodríguez, administrador y profesor.
2. **Personas** permite preparar invitaciones demo; no envía correo. La cuenta invitada no puede activarse desde el login web en esta versión.
3. **Cursos** permite asignar profesores y alumnos demo. Abre un curso para programar sesiones y ver su lista pendiente.
4. **Mis clases** muestra en modo lectura las sesiones de los cursos asignados a Ventura.
5. Recargar restablece las personas, cursos y sesiones demo. La sesión Auth0 se recupera con la cookie mientras siga vigente.

## Portal del alumno

1. Entra en <http://localhost:5191/> con `ada.lopez@clase.test`.
2. Abre **Resumen** para ver el historial de ejemplo. **Avisar** permite registrar avisos demo.
3. El acceso con invitación no activa cuentas nuevas. El login muestra que la activación todavía no está disponible.
4. El historial y los avisos se conservan en el navegador. Para reiniciar los datos locales de esta demo, abre <http://localhost:5191/?reiniciar>. La sesión Auth0 se recupera mientras siga vigente; usa **Cerrar sesión** para terminarla.

## QR y entrada

1. En Electron, abre **Hoy → Abrir lista**. Aparecen el QR y un código que cambian cada 30 segundos.
2. En el navegador, escanea el QR o escribe el código. Si no hay una sesión web, inicia sesión como Ada; el enlace pendiente continúa después del login.
3. La entrada de alumno se conserva en el historial web. No aparece en la lista del profesor: el registro de asistencia de Electron sigue siendo una demo separada del portal web.
4. Para que un móvil llegue al servidor Vite, ambos equipos deben compartir wifi. Configura `VITE_STUDENT_SITE_URL` con la IP del ordenador al arrancar Electron y pasa `--host` a `pnpm run demo:web`. Si abres la web desde la IP en vez de `localhost`, configura también `ATEMPO_WEB_ORIGIN` con ese origen antes de arrancar el router.

## Invitaciones locales de Electron

Las invitaciones simuladas siguen disponibles en Electron cuando lo arrancas con `pnpm run demo:desktop`. Por ejemplo, para Lucía:

```sh
cd desktop
pnpm dev -- --invitation=731905
```

El envío de correo y el enlace real todavía no están conectados. Estas invitaciones no crean usuarios Auth0 ni activan cuentas del portal web.

Para volver a empezar la demo de Electron, cierra la app y el servidor con **Ctrl+C** y ejecuta de nuevo `pnpm run demo:desktop`.