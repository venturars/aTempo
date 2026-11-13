# aTempo

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene la aplicación de escritorio del profesor y la guía visual compartida.

La visión, los perfiles y las decisiones de producto están en [principles.md](principles.md).

## Qué hay

| Carpeta | Qué es |
| --- | --- |
| `desktop/` | Aplicación del profesor. Electron, React y SQLite. La pantalla de arranque es el login. Cada pantalla tiene su dirección en el hash, por ejemplo `#/sign-up` para el registro. |
| `docs/storybook/` | Fuente de verdad visual: Tailwind y daisyUI. Las pantallas usan las clases. No hay un paquete de componentes. |
| `docs/guia/` | Markdown generado desde Storybook. No se versiona. Lo leen los agentes. |
| `docs/` | Cómo se construye: constitución, arquitectura, estilo y árbol de carpetas. |

Cada carpeta con código tiene su propio `package.json`. No hay workspace en la raíz. El gestor es pnpm 10.33.0 y las versiones van fijas.

## Instalación

Docker instala el paquete [delivery-workflow](https://github.com/venturars/delivery-workflow) y las dependencias con las mismas versiones para todo el equipo: Node 24, pnpm 10.33.0 y APM 0.35.0. El porqué está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#entorno-de-instalación).

Necesitas en tu ordenador:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), en marcha.
- git, [GitHub CLI](https://cli.github.com) (`gh`), Node 20 o superior y bash, para el flujo de delivery-workflow. En Windows, con WSL o Git Bash.
- Un `.env` en la raíz con `GITHUB_TOKEN=tu_token`, un token clásico de tu cuenta con el permiso `repo`. Ya está en `.gitignore`.

Una sola vez, al clonar:

```sh
git config core.hooksPath .githooks
docker compose run --rm setup
```

`setup` instala delivery-workflow para Cursor, Codex y Claude Code en la raíz del proyecto, y las dependencias de `desktop/` y `docs/storybook/` dentro de Docker, en volúmenes. Los `node_modules` de Linux no llegan a tu carpeta.

Desde entonces, git lo lanza solo después de `git pull`, de cambiar de rama o de un rebase, si cambió `apm.yml`, `apm.lock.yaml` o un `pnpm-lock.yaml`. Si Docker no está en marcha, git avisa y sigue: lanza `docker compose run --rm setup` cuando lo arranques.

Para cambiar de versión de delivery-workflow, cambia la etiqueta en `apm.yml` (por ejemplo, `#v0.1.2` por `#v0.1.3`), lanza `docker compose run --rm setup` y sube `apm.yml` y `apm.lock.yaml` en una pull request `chore`.

Si tu herramienta abre Dev Containers, como VS Code, puedes abrir el proyecto con `.devcontainer/devcontainer.json`: usa la misma imagen. Es opcional.

## Escritorio

Las comprobaciones se lanzan en Docker, con las versiones del equipo:

```sh
docker compose run --rm desktop pnpm typecheck
docker compose run --rm desktop pnpm lint
```

La ventana de Electron se abre en tu ordenador, no en Docker. Instala allí sus dependencias:

```sh
cd desktop
pnpm install
pnpm dev
```

`pnpm run test:visual` construye la app y ejecuta las pruebas de Playwright. Necesita la ventana, así que también va en tu ordenador.

## Guía visual

```sh
docker compose up storybook
```

Storybook queda en <http://localhost:6006>. Abre en el tema `atempo-oscuro`. La barra de Storybook cambia a `atempo-claro`. Para pararlo, `Ctrl+C` o `docker compose stop storybook`.

El markdown para los agentes se genera en [docs/guia](docs/guia/README.md) y no se sube a git. Si cambia Storybook, desde la raíz:

```sh
docker compose run --rm storybook pnpm guide
```

Ese comando es obligatorio: sin él, el markdown se queda desfasado. No se edita `docs/guia/` a mano.

## Documentación

| Documento | Para qué |
| --- | --- |
| [principles.md](principles.md) | Visión, usuarios, pantallas y decisiones de producto. |
| [docs/CONSTITUTION.md](docs/CONSTITUTION.md) | Lo que ya está decidido para construir. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Las tres capas del escritorio y el entorno de instalación. |
| [docs/STYLE.md](docs/STYLE.md) | Temas y enlace a la guía visual. |
| [docs/guia](docs/guia/README.md) | Markdown generado desde Storybook. No se versiona. |
| [docs/TREE.md](docs/TREE.md) | Carpetas de `desktop/`. |
| [AGENTS.md](AGENTS.md) | Cómo se trabaja una spec. |
