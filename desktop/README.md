# desktop

An Electron application with React and TypeScript

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

El dashboard del alumno (maqueta) se abre con:

```bash
$ pnpm run dev:dashboard
```

Eso arranca Electron con el hash `#/student/dashboard`. Con `pnpm run dev` la ventana queda en el login; en desarrollo puedes abrir el dashboard añadiendo `#/student/dashboard` a la URL del renderer.

### Visual test

Builds the app and runs Playwright. The checks and the screenshots are documented in `docs/STYLE.md`.

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
