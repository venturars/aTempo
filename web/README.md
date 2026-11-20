# Web del alumno

Sitio del alumno, separado de Electron. Importa el tema de `docs/storybook/src/system.css` y usa clases de daisyUI.

```sh
cd web
pnpm install
pnpm dev
```

Abre http://localhost:5191/. La cuenta de ejemplo es `ada.lopez@clase.test` / `clase-2026`. La sesión, las cuentas, las entradas y los avisos se guardan en `localStorage`, así que siguen al abrir el enlace del QR en una pestaña nueva.

Para registrar la asistencia hace falta el QR de la app del profesor de #130 (rama `129-feat-teacher-qr-invitations`, Hoy → Abrir lista). El QR y el código de 6 cifras de debajo cambian cada 30 segundos. La regla está en `src/student/classCode.ts` y es la misma que usa la app del profesor. La clase de ejemplo es de lunes a viernes a las 09:00. El código registra hasta las 21:00, en la hora del dispositivo del alumno. Desde las 21:00, y en sábado y domingo, no registra.

- Con la cámara del móvil, el QR abre `/student/check-in?code=ATEMPO-CLASE-1109-<código>`. Si la sesión está abierta, apunta la entrada. Si no, pide entrar y la apunta con la hora del escaneo, si entra antes de 10 minutos.
- En Registrar asistencia se puede escanear el QR desde la web, si el navegador lo permite, o escribir las 6 cifras.
- Se aceptan el código anterior, el actual y el siguiente, por si el reloj del móvil va unos segundos por detrás.

Para probarlo con el móvil, el móvil y el ordenador tienen que estar en la misma wifi. Arranca la web con `pnpm dev --host`. Arranca la app del profesor desde `desktop/` con `VITE_STUDENT_SITE_URL=<dirección de red que enseña Vite> pnpm dev`, por ejemplo `VITE_STUDENT_SITE_URL=http://192.168.1.20:5191 pnpm dev`.

Para volver a probar el recorrido en desarrollo, abre http://localhost:5191/?reiniciar. Borra las entradas, las cuentas nuevas, los avisos y el escaneo pendiente de este navegador, entra con la cuenta de ejemplo y abre el inicio del alumno.

También solo en desarrollo, el inicio (`/student/dashboard`) acepta otra hora y otro día para ver cada estado de Tempito: `?hora=08:50`, `?hora=08:59:45` (con segundos) o `?dia=sab&hora=10:00` (otro día de esta semana).

## Probar el historial y las rutas del alumno

Sin sesión, abrir una pantalla privada del alumno devuelve al login. El enlace de registro de asistencia por QR pide iniciar sesión antes de guardar la entrada.

Con sesión iniciada y el servidor de desarrollo en marcha, abre estas rutas a 390 px en ambos temas:

- `/student/history?fixture=carga` muestra el estado de carga.
- `/student/history?fixture=vacio` muestra el historial vacío y los totales de una cuenta sin clases.
- `/student/history?fixture=error` muestra un error de carga. **Reintentar** vuelve al historial de la cuenta.

Los fixtures solo funcionan en desarrollo y no cambian las clases ni los avisos guardados. El historial sin parámetros muestra los datos de la cuenta.

`pnpm build` comprueba los tipos y genera `dist/`.
