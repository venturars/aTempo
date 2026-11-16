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

## Escritorio

```sh
cd desktop
pnpm install
pnpm dev
```

`pnpm typecheck` comprueba los tipos. `pnpm run test:visual` construye la app y ejecuta las pruebas de Playwright con Electron oculto en macOS. Antes de la suite se comprueba el arnés con el [smoke de escritorio](desktop/README.md#visual-test).

Las pruebas Electron usan `tests/helpers/electron.ts` para ejecutar el main, preload y renderer construidos con las ventanas nativas ocultas. El arnés funciona en macOS y aborta en otras plataformas. Instala guardas antes de cargar el main, comprueba visibilidad y foco nativos y vigila el PID en primer plano desde antes del arranque hasta el cierre. Conserva las auditorías en el directorio temporal `atempo-hidden-*` indicado en la salida. El arranque normal con `pnpm dev` no cambia.

Antes de las suites, es obligatorio construir sin abrir la app y pasar el smoke oculto, sin reintentos:

```sh
pnpm exec electron-vite build
pnpm exec playwright test tests/hidden-electron.spec.ts --workers=1 --retries=0 --timeout=30000 --global-timeout=45000
```

El helper comprueba la fuente y el build antes de lanzar Electron. Si falla una guarda, la observación de macOS o el smoke, el arnés aborta y cierra sus procesos; las suites quedan bloqueadas. No hay alternativa con ventanas visibles.

Tras pasar el smoke, construir Storybook desde `docs/storybook` con `pnpm build-storybook` y ejecutar las suites desde `desktop`:

```sh
pnpm run test:visual --workers=1 --retries=0 --global-timeout=300000 --update-snapshots=none
```

La suite del sistema visual sirve y cierra su propia vista previa local de Storybook. Esta rama combina el sistema compartido de #69 con el panel real del profesor de #36. La verificación de esa combinación corresponde a #48 y requiere ejecutar el smoke y las suites sobre este árbol; los resultados previos de #69 no la acreditan. La incorporación del dashboard del alumno queda para #70.

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

## Avisos opcionales de PR en Discord

El workflow `.github/workflows/discord-pr-notifications.yml` activa los avisos desde `main` para las PR dirigidas a `staging` y los comentarios de asociación. Usa la acción compartida fijada a un commit y no ejecuta código de la PR. APM no instala este workflow ni lo incorpora a los pasos de los agentes.

Al solicitar al menos dos revisores, el bot publica el repositorio, un resumen y el enlace de la PR. Muestra los logins de GitHub aunque no encuentre sus cuentas de Discord, y menciona únicamente a quienes tengan una asociación verificada. Las asociaciones se guardan cifradas durante 48 horas en una caché propia de aTempo.

Para confirmar una asociación que falte, el autor de la PR o un miembro autorizado del repositorio puede dejar este comentario en la PR:

```text
/discord-map LOGIN_GITHUB ID_DISCORD
```

Reemplaza los valores por el login exacto del revisor solicitado y su ID numérico de Discord. Para copiar el ID, activa el modo desarrollador de Discord, abre el menú del usuario y selecciona **Copiar ID de usuario**. El workflow valida que la persona sea revisora y que el ID pertenezca al servidor antes de guardar la asociación y enviar una mención adicional. El comentario queda visible en la PR; no incluyas tokens ni claves.

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
