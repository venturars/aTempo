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

## Avisos opcionales de PR en Discord

Los tres workflows de `.github/workflows/discord-pr-*.yml` activan los avisos en este repositorio; APM no los instala ni forman parte de los pasos de los agentes. El emisor vive en `main`, mientras que los disparadores recogen PR dirigidas a `staging` y comentarios de asociación. La función queda activa cuando estos workflows llegan a `main`.

Al solicitar al menos dos revisores, el bot publica el repositorio, un resumen y el enlace de la PR. Muestra los logins de GitHub aunque no encuentre sus cuentas de Discord, y menciona únicamente a quienes tengan una asociación verificada. Las asociaciones se guardan cifradas durante 48 horas en una caché propia de aTempo.

Para confirmar una asociación que falte, el autor de la PR o un miembro autorizado del repositorio puede dejar este comentario en la PR:

```text
/discord-map LOGIN_GITHUB ID_DISCORD
```

Reemplaza los valores por el login exacto del revisor solicitado y su ID numérico de Discord. Para copiar el ID, activa el modo desarrollador de Discord, abre el menú del usuario y selecciona **Copiar ID de usuario**. El workflow valida que la persona sea revisora y que el ID pertenezca al servidor antes de guardar la asociación y enviar una mención adicional. El comentario queda visible en la PR; no incluyas tokens ni claves.

El administrador configura el entorno protegido `Discord-PR-Notifications`, restringido a `main`, con estos datos:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secreto | `DISCORD_BOT_TOKEN` | Token del bot de Discord que ya usa el servidor. |
| Secreto | `DISCORD_CACHE_KEY` | Clave aleatoria de 32 bytes codificada en Base64. |
| Variable | `DISCORD_GUILD_ID` | ID del servidor de Discord. |
| Variable | `DISCORD_GIT_CHANNEL_ID` | ID del canal `#git`. |

Tras fusionar los workflows en `main`, prueba con una PR hacia `staging` que tenga al menos dos revisores. Comprueba el mensaje en `#git` y repite la ejecución para verificar que no se publique un duplicado. La acción debe fijarse a un SHA completo publicado de `delivery-workflow`. El SHA de `v0.3.0` aún no incluye la corrección de la PR #35; antes de activar esta integración, actualízalo a una versión posterior que la contenga.

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
