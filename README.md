# aTempo

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene la aplicación de escritorio del profesor y la guía visual compartida.

La visión, los perfiles y las decisiones de producto están en [principles.md](principles.md).

## Qué hay

| Carpeta | Qué es |
| --- | --- |
| `desktop/` | Aplicación del profesor. Electron, React y SQLite. Incluye login y un prototipo visual de administración de la organización. |
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

El login simulado abre el Dashboard de la organización cuando el correo y la contraseña son válidos. Este prototipo reutiliza Electron para revisar la pantalla administrativa con datos locales ficticios; no autentica ni ofrece funciones de administración.

El Dashboard muestra un único contador global de estudiantes con patrón de ausencias o retrasos, una tabla por curso, estudiantes a revisar y pendientes. Cada estudiante cuenta una sola vez, aunque tenga ambos patrones. No incluye salidas anticipadas. Los datos y los umbrales son informativos y no aplican sanciones.

`pnpm typecheck` comprueba los tipos. `pnpm run test:visual` construye la app y ejecuta las pruebas de Playwright.

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
