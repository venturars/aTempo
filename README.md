# aTempo

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene la aplicación de escritorio del profesor, la guía visual compartida y una automatización de GitHub Actions para avisos de revisión.

La visión, los perfiles y las decisiones de producto están en [principles.md](principles.md).

## Qué hay

| Carpeta | Qué es |
| --- | --- |
| `desktop/` | Aplicación del profesor. Electron, React y SQLite. La pantalla que hay es el login. |
| `automation/discord-pr-notifications/` | Verificación de PR, relaciones cifradas y avisos de revisión. |
| `.github/workflows/` | Disparador de PR y publicación mediante GitHub Actions. |
| `docs/storybook/` | Fuente de verdad visual: Tailwind y daisyUI. Las pantallas usan las clases. No hay un paquete de componentes. |
| `docs/guia/` | Markdown generado desde Storybook. No se versiona. Lo leen los agentes. |
| `docs/` | Cómo se construye: constitución, arquitectura, estilo y árbol de carpetas. |

`desktop/` y `docs/storybook/` tienen cada uno su propio `package.json`. No hay workspace en la raíz. El gestor de esos paquetes es pnpm 10.33.0 y las versiones van fijas. La automatización actual usa Node sin paquete propio.

## Escritorio

```sh
cd desktop
pnpm install
pnpm dev
```

`pnpm typecheck` comprueba los tipos. `pnpm run test:visual` construye la app y pasa el test de la pantalla de login.

## Avisos de revisión de PR

El workflow `Discord PR notification trigger` se activa al abrir una PR hacia `staging`, solicitar revisión o marcarla como lista. Sin acceder a secretos ni ejecutar código de la PR, guarda su número como un artefacto no confiable.

Cuando termina ese workflow, `Discord PR notification publisher` se ejecuta desde `main` con el entorno protegido `discord-pr-notifications`. Descarga el número, consulta la PR actual mediante la API de GitHub y comprueba que está abierta, lista para revisión, dirigida a `staging`, asociada al disparador y con exactamente dos revisores distintos solicitados. Si falla alguna comprobación, el job termina con error. El emisor no ejecuta código de la PR.

El emisor recupera todos los artefactos vigentes de relaciones, descifra las entradas y descarta cada relación que haya cumplido 48 horas. Fusiona las relaciones de diferentes ejecuciones; si un login aparece con IDs distintos, exige volver a resolverlo. Cada ejecución conserva su fichero cifrado dos días. Los jobs comparten un grupo de concurrencia para evitar escrituras simultáneas. Si falta una relación, se buscan **ambos** revisores en Discord; solo una coincidencia exacta y única entre login de GitHub y nombre de usuario de Discord se guarda. Si alguna identidad queda sin resolver o es ambigua, no se publica y el job falla con el motivo.

El mensaje del bot existente contiene título, resumen breve, enlace y las dos menciones. `allowed_mentions` limita las etiquetas a los IDs resueltos. Un comentario técnico cifrado en cada PR registra las parejas ya notificadas y evita repetir el aviso. Si Discord acepta el mensaje pero falla ese registro, el workflow indica que el estado es incierto: hay que comprobar `#git` antes de reintentarlo. Se necesita `issues:write` para guardar el registro.

### Configuración y despliegue

Un administrador del repositorio debe crear el entorno de GitHub Actions `discord-pr-notifications`, limitarlo a `main` y configurar:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secreto | `DISCORD_BOT_TOKEN` | Token del bot de Discord que ya está en el servidor. |
| Secreto | `DISCORD_CACHE_KEY` | Clave aleatoria de 32 bytes codificada en base64. Se puede generar con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. |
| Variable | `DISCORD_GUILD_ID` | `1559533384894648340` |
| Variable | `DISCORD_GIT_CHANNEL_ID` | `1559906683008843806` |

El bot necesita acceso al servidor y permisos para ver y escribir en `#git`. Los dos workflows deben estar desplegados en las ramas que GitHub usa para los eventos: el disparador en `staging` y el emisor en la rama predeterminada `main`. La publicación real depende de esa configuración y de una PR de prueba lista para revisión con dos revisores identificables. La implementación y las pruebas locales se siguen en la [issue #40](https://github.com/venturars/aTempo/issues/40).

Para comprobar la lógica localmente: `node --test automation/discord-pr-notifications/*.test.mjs`.

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
