# Web del alumno

Sitio del alumno, separado de Electron. Importa el tema de `docs/storybook/src/system.css` y usa clases de daisyUI.

```sh
cd web
pnpm install
pnpm dev
```

Abre http://localhost:5191/. La cuenta de ejemplo es `ada.lopez@clase.test` / `clase-2026`.

En Registrar asistencia, el QR de la clase de ejemplo es `ATEMPO-CLASE-1109` y el código de 6 cifras es `482913`.

Para volver a probar el recorrido en desarrollo, abre http://localhost:5191/?reiniciar. Borra las entradas y los avisos de esa pestaña, entra con la cuenta de ejemplo y abre el inicio del alumno.

`pnpm build` comprueba los tipos y genera `dist/`.
