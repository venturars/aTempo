# aTempo

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene la aplicación de escritorio del profesor y la guía visual compartida.

La visión, los perfiles y las decisiones de producto están en [principles.md](principles.md).

## Qué hay

| Carpeta | Qué es |
| --- | --- |
| `desktop/` | Aplicación del profesor. Electron, React y SQLite. La pantalla que hay es el login. |
| `docs/storybook/` | Fuente de verdad visual: Tailwind y daisyUI. Las pantallas usan las clases. No hay un paquete de componentes. |
| `docs/guia/` | Markdown generado desde Storybook. No se versiona. Lo leen los agentes. |
| `docs/` | Cómo se construye: constitución, arquitectura, estilo y árbol de carpetas. |

Cada carpeta con código tiene su propio `package.json`. No hay workspace en la raíz. El gestor es pnpm 10.33.0 y las versiones van fijas.

## Escritorio

```sh
cd desktop
pnpm install
pnpm dev
```

`pnpm typecheck` comprueba los tipos. `pnpm run test:visual` construye la app y pasa el test de la pantalla de login.

## Guía visual

```sh
cd docs/storybook
pnpm install
pnpm storybook
```

Abre en el tema `atempo-oscuro`. La barra de Storybook cambia a `atempo-claro`.

El markdown para los agentes se genera en [docs/guia](docs/guia/README.md) y no se sube a git. Si cambia Storybook, desde `docs/storybook`:

```sh
pnpm guide
```

Ese comando es obligatorio: sin él, el markdown se queda desfasado. No se edita `docs/guia/` a mano.

## Flujo de entrega

El paquete [delivery-workflow v0.1.0](https://github.com/venturars/delivery-workflow/tree/v0.1.0) aporta el flujo de issues, ramas, PR en borrador y la caché de revisores. Requiere APM, Node 20 o superior y `gh` con sesión iniciada. Desde CMD, en la raíz del repositorio:

```bat
set "GITHUB_TOKEN="
apm install
```

La instalación genera las skills en `.agents/skills/` y los agentes de Cursor y Codex en sus carpetas locales. Esos archivos no se versionan. Para usar el MCP de GitHub, define `GITHUB_TOKEN` desde tu sesión de `gh` antes de abrir el agente; no guardes el valor en el repositorio.

En Codex, llama a `$delivery-workflow`; en Cursor, a `/delivery-workflow`. Cuando se pidan revisores, el flujo consulta primero `github-cache` y solo busca los nombres ausentes. La caché local se crea al usarla en `.git/.git-workflow-cache.json`, caduca a las 48 horas y no se sube a Git.

## Documentación

| Documento | Para qué |
| --- | --- |
| [principles.md](principles.md) | Visión, usuarios, pantallas y decisiones de producto. |
| [docs/CONSTITUTION.md](docs/CONSTITUTION.md) | Lo que ya está decidido para construir. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Las tres capas del escritorio. |
| [docs/STYLE.md](docs/STYLE.md) | Temas y enlace a la guía visual. |
| [docs/guia](docs/guia/README.md) | Markdown generado desde Storybook. No se versiona. |
| [docs/TREE.md](docs/TREE.md) | Carpetas de `desktop/`. |
| [AGENTS.md](AGENTS.md) | Cómo se trabaja una spec. |
