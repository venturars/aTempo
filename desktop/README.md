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
