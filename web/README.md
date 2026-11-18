# Web del alumno

Sitio del alumno, separado de Electron. Importa el tema de `docs/storybook/src/system.css` y usa clases de daisyUI.

```sh
cd web
pnpm install
pnpm dev
```

Abre http://localhost:5191/. La cuenta de ejemplo es `ada.lopez@clase.test` / `clase-2026`.

Para registrar la asistencia hace falta el QR de la app del profesor (Hoy → Abrir lista). El QR y el código de 4 cifras de debajo cambian cada 30 segundos. La regla está en `src/student/classCode.ts` y es la misma que usa la app del profesor.

- Con la cámara del móvil, el QR abre `/student/check-in?code=ATEMPO-CLASE-1109-<código>`. Si la sesión está abierta, apunta la entrada. Si no, pide entrar y la apunta con la hora del escaneo.
- En Registrar asistencia se puede escanear el QR desde la web, si el navegador lo permite, o escribir las 4 cifras.
- Se aceptan el código anterior, el actual y el siguiente, por si el reloj del móvil va unos segundos por detrás.

Para probarlo con el móvil, el móvil y el ordenador tienen que estar en la misma wifi. Arranca la web con `pnpm dev --host` y usa la dirección de red que enseña Vite (por ejemplo `http://192.168.1.20:5191`) como sitio del alumno en la app del profesor.

Para volver a probar el recorrido en desarrollo, abre http://localhost:5191/?reiniciar. Borra las entradas y los avisos de esa pestaña, entra con la cuenta de ejemplo y abre el inicio del alumno.

`pnpm build` comprueba los tipos y genera `dist/`.
