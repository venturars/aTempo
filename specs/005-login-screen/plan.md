# Plan — Pantalla de login

## Marco

La aplicación vive en `desktop/` y sale de la plantilla oficial `react-ts` de electron-vite.

- Tailwind y daisyUI se instalan como dice la guía de daisyUI para Vite.
- El tema `atempo` se declara con `@plugin "daisyui/theme"`.
- Zustand guarda el correo, la contraseña, los errores y los datos del alert.
- SQLite se abre en el proceso principal con `DatabaseSync` de `node:sqlite`. El login no la usa.

## Archivos

- `desktop/src/renderer/src/login/LoginScreen.tsx`
- `desktop/src/renderer/src/login/validateLogin.ts`
- `desktop/src/renderer/src/login/loginStore.ts`
- `desktop/src/renderer/src/styles/app.css`
- `desktop/src/main/database.ts`
- `desktop/tests/login.spec.ts`

## Comprobación de la constitución

- El stack es el de [docs/CONSTITUTION.md](../../docs/CONSTITUTION.md): Electron, React, Node, Tailwind, daisyUI, Zustand y SQLite.
- Los nombres de archivo van en inglés. Los textos de la pantalla van en español.
- Los colores y la prueba visual siguen [docs/STYLE.md](../../docs/STYLE.md).
- Las capas siguen [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

## Prueba

`pnpm run test:visual` construye la app y lanza Playwright sobre `out/main/index.js`. Cubre CA-01, CA-02, CA-03 y CA-04.
