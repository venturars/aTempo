# desktop

An Electron application with React and TypeScript

## Login con Auth0

Con `ATEMPO_API_ROUTER_URL=http://localhost:3000` en el entorno del proceso Electron, el formulario llama al router mediante el proceso principal de Electron. El Access Token se cifra con `safeStorage` y solo permanece en memoria del proceso principal hasta salir o cerrar la aplicación. El renderer no recibe el token. Para otros hosts, la URL del router debe usar HTTPS; HTTP solo se admite en loopback para desarrollo. En Linux se rechaza el backend `basic_text` de `safeStorage`. Si la variable no está configurada, el login mantiene las cuentas de ejemplo para la demo y Playwright.

El proceso principal envía `Authorization: Bearer <accessToken>` a `GET /auth/me`; un `401` descarta la sesión. «Cerrar sesión» limpia el token y vuelve al login. Las cuentas de prueba con los correos `profesor@atempo.test` y `ada.lopez@clase.test` abren sus paneles de demo. Sus contraseñas reales se configuran en Auth0 y no se guardan en el repositorio. El panel web usará cookies en una fase posterior.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm run dev
```

### Visual test

Builds the app and runs Playwright serially through `tests/helpers/electron.ts`. The hidden Electron harness requires macOS and loads the real built main, preload and renderer. The checks and the screenshots are documented in [docs/STYLE.md](../docs/STYLE.md).

Before running the suite, build the app, run the source/build preflight and check the harness with its smoke test:

```bash
$ pnpm exec electron-vite build
$ node tests/helpers/hidden-preflight.cjs
$ pnpm exec playwright test tests/hidden-electron.spec.ts --workers=1
```

The smoke checks DOM input, hash navigation and a nonempty screenshot while the native window stays hidden and unfocused. Guards are installed before the built main loads; a separate watchdog observes the foreground application from before launch through cleanup. If the preflight, observer or smoke fails, stop before running the suite.

Each launch prints `Hidden Electron evidence: <directory>`. That temporary directory contains `native.jsonl`, `foreground.jsonl` and `lifecycle.jsonl` for the window, foreground and process cleanup audit. The smoke screenshot is saved in its Playwright test output directory.

After the smoke passes:

```bash
$ pnpm run test:visual
```

### Build

```bash
# For windows
$ pnpm run build:win

# For macOS
$ pnpm run build:mac

# For Linux
$ pnpm run build:linux
```
