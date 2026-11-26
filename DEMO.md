# Demo de aTempo

Electron conserva una demo local con cuentas y datos de ejemplo. La web de alumnado y administración requiere Auth0 y el api-router; no ofrece acceso simulado sin ellos. El panel web usa datos demo en memoria y el portal del alumno conserva su historial y avisos en el navegador.

## Arrancar

Necesitas Node 24, pnpm 10.33.0, Docker disponible y un `.env` local con la configuración de Auth0. En Windows y macOS, si Docker Desktop está instalado, `pnpm run atempo` intenta iniciarlo cuando el motor no responde. En Linux, arranca manualmente el motor Docker antes de ejecutar el comando. Desde la raíz del repositorio:

```sh
pnpm run atempo
```

El comando instala las dependencias de `web/` y `desktop/` cuando faltan, levanta `api-router` en Docker (puerto 3004 por defecto), sirve la web en <http://localhost:5191> y abre Electron. Cambia el puerto del router con `pnpm run atempo --port 3005`; `pnpm run atempo --router-only` inicia solo el router.

Configura `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` y `AUTH0_AUDIENCE` en el `.env` de la raíz. Abre <http://localhost:5191/> para el alumno y <http://localhost:5191/admin> para administración. Usa las contraseñas registradas en Auth0:

| Correo | Área de la web | Datos demo |
| --- | --- | --- |
| `ada.lopez@clase.test` | Portal del alumno | Ada López |
| `profesor@atempo.test` | Administración | Ventura Rodríguez |

El router guarda la sesión en memoria y entrega una cookie HttpOnly. La cookie no tiene Max-Age; el router expira las sesiones a los siete días. Reiniciar el router invalida las sesiones. El login web no crea cuentas. **Crear cuenta** y activar una invitación muestran un aviso de que todavía no están disponibles.

### Electron sin Auth0

Para depurar solo el escritorio sin web ni router, usa `pnpm run demo:desktop` desde la raíz. Entra con las cuentas públicas de ejemplo de Electron: `profesor@atempo.test` / `Profesor123!` o `ada.lopez@clase.test` / `clase-2026`. Las invitaciones de prueba de Electron se describen más abajo.

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
4. Para que un móvil llegue al servidor Vite, ambos equipos deben compartir wifi. Configura `VITE_STUDENT_SITE_URL` con la IP del ordenador al arrancar Electron y arranca la web con `--host`, por ejemplo `pnpm --dir web dev -- --host`. Si abres la web desde la IP en vez de `localhost`, configura también `ATEMPO_WEB_ORIGIN` con ese origen antes de arrancar el router.

## Invitaciones locales de Electron

Las invitaciones simuladas siguen disponibles en Electron cuando lo arrancas con `pnpm run demo:desktop`. Por ejemplo, para Lucía:

```sh
cd desktop
pnpm dev -- --invitation=731905
```

El envío de correo y el enlace real todavía no están conectados. Estas invitaciones no crean usuarios Auth0 ni activan cuentas del portal web.

## Volver a empezar

- Portal del alumno: abre <http://localhost:5191/?reiniciar> para borrar historial y avisos locales de este navegador.
- Administración web: recarga la página para restablecer los datos demo en memoria.
- Electron: cierra la app con **Cmd+Q** en macOS y vuelve a ejecutar `pnpm run atempo` desde la raíz, o `pnpm run demo:desktop` para depuración aislada. El login Auth0 en Electron requiere que `api-router` esté arrancado.