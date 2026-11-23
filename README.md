# aTempo

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene el prototipo de escritorio para profesor y alumno y la guía visual compartida.

La visión, los perfiles y las decisiones de producto están en [principles.md](principles.md).

## Probar las demos de profesor y alumno

Para abrir Electron en tu ordenador necesitas Node 24 y pnpm 10.33.0. Desde la raíz de la copia que vas a revisar, instala las dependencias nativas y arranca la aplicación:

```sh
cd desktop
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Comprueba que las versiones muestran `v24.x` y `10.33.0`.

Desde un arranque nuevo, usa el formulario **Entrar** con una de estas cuentas públicas de ejemplo:

| Perfil | Correo | Contraseña | Destino |
| --- | --- | --- | --- |
| Profesor | `profesor@atempo.test` | `Profesor123!` | Hoy, en el panel del profesor |
| Alumno | `ada.lopez@clase.test` | `clase-2026` | Dashboard de Ada López |

Como profesor, entra en **Hoy** y pulsa **Abrir lista** para ver la lista de alumnos y pasar lista. Cada cambio de marca o de hora pide un motivo.

La pestaña Hoy usa un cliente de la API con datos simulados. Para ver otro caso, arranca desde `desktop/` con `pnpm exec electron-vite dev -- --api-fixture=<nombre>`: `empty` (sin clases hoy), `denied` (sin acceso), `unauthenticated` (sesión caducada: vuelve al login), `network` (las escrituras no llegan), `timeout` (las escrituras no responden en 10 segundos), `server-error` (las escrituras responden 500), `conflict` (la clase se abrió desde otro sitio) `expired-code` (el primer código del QR llega caducado) o `code-unavailable` (las dos primeras peticiones del código fallan).

Para probar al alumno desde el login, sal completamente de la aplicación: en macOS usa **Cmd+Q**; cerrar solo la ventana no termina el proceso. Detén también `pnpm dev` con **Ctrl+C** en su terminal y vuelve a ejecutar `pnpm dev` desde `desktop/`.

Como alumno, pulsa **Registrar asistencia**, **Escanear** y **Llegar a las 08:58**. Debe aparecer el estado **Presente** con la hora **08:58**. Pulsa **Volver** y **Resumen de asistencia** para comprobar la nueva entrada en el historial.

El correo admite mayúsculas y espacios laterales; la contraseña debe coincidir exactamente. Una contraseña incorrecta o un correo desconocido muestran un error y conservan el login. El registro crea alumnos y reserva el correo del profesor.

Las cuentas, la sesión y la asistencia de ejemplo viven en memoria del renderer. Recargarlo o reiniciar completamente la aplicación vacía la sesión, restablece los datos de ejemplo y elimina los alumnos registrados durante ese arranque. Repite la salida completa y el arranque para probar otra cuenta desde cero.

El lector del alumno ofrece lecturas simuladas y no usa cámara. Estos flujos no se conectan al backend ni a un servicio de autenticación.

## Qué hay

| Carpeta | Qué es |
| --- | --- |
| `desktop/` | Prototipo para profesor y alumno con Electron y React; las demos usan datos en memoria. La pantalla de arranque es el login. Cada pantalla tiene su dirección en el hash, por ejemplo `#/sign-up` para el registro. |
| `api-router/` | API REST con NestJS entre los frontends y la SDK de lógica de negocio (pendiente). |
| `api-postgresql/` | API REST con NestJS entre la SDK y PostgreSQL. |
| `api-rustfs/` | API REST con Express entre la SDK y RustFS (persistencia de objetos). |
| `api-sqlite/` | Servicio Flask con Pydantic y SQLAlchemy Core entre la SDK prevista y SQLite. |
| `postgres/` | Core PostgreSQL y Drizzle Studio para ver sus tablas. No se abre desde el escritorio ni desde el API-router. |
| `sqlite/` | SQLite operativo de fichaje y Datasette. Distinto del `atempo.sqlite` del escritorio. |
| `rustfs/` | Justificantes (bucket `justifications`) y consola de RustFS. |
| `blockend/` | Anvil, Hardhat, contrato por curso y Otterscan. |
| `docs/storybook/` | Fuente de verdad visual: Tailwind y daisyUI. Las pantallas usan las clases. No hay un paquete de componentes. |
| `docs/guia/` | Markdown generado desde Storybook. No se versiona. Lo leen los agentes. |
| `docs/` | Cómo se construye: constitución, arquitectura, estilo, árbol y modelo de cada almacén. |
| `permanent-data.md` | Enlaces entre las cuatro bases. No es un quinto almacén. |

Cada servicio tiene sus dependencias propias y no hay workspace en la raíz. Los paquetes JavaScript usan pnpm 10.33.0 y versiones fijas. `api-sqlite/` usa Python y dependencias fijadas en `pyproject.toml`. `postgres/`, `sqlite/`, `blockend/` y `rustfs/` se instalan y arrancan en el ordenador. Compose de la raíz orquesta los mismos procesos, cada uno con su perfil (`db`, `sqlite`, `blockend` y `rustfs`); no es requisito. Ninguno entra en el compose de instalación. El modelo de cada una está en `docs/` (nombres en MAYÚSCULAS) y el arranque nativo en su `README.md`.

| Almacén | Visor | URL |
| --- | --- | --- |
| PostgreSQL | Drizzle Studio | <https://local.drizzle.studio> |
| SQLite operativo | Datasette | <http://localhost:8001> |
| RustFS | Consola | <http://localhost:9001/rustfs/console/> |
| Anvil | Otterscan | <http://localhost:5100> |

## Instalación

Docker instala el paquete [delivery-workflow](https://github.com/venturars/delivery-workflow) y las dependencias con las mismas versiones para todo el equipo: Node 24, pnpm 10.33.0 y APM 0.35.0. El porqué está en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#entorno-de-instalación).

Necesitas en tu ordenador:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), en marcha.
- git, [GitHub CLI](https://cli.github.com) (`gh`), Node 20 o superior y bash, para el flujo de delivery-workflow. En Windows, con WSL o Git Bash.
- Un `.env` en la raíz, ignorado por Git. Añade `GITHUB_TOKEN=tu_token` para delivery-workflow y `ATEMPO_POSTGRES_PASSWORD` con una contraseña aleatoria hexadecimal de 64 caracteres para PostgreSQL local. Crea el token en <https://github.com/settings/tokens/new?scopes=repo>: un token clásico de tu cuenta con el permiso `repo`. Las APIs montan solo su carpeta y no reciben el `.env`; el servicio `setup` y las herramientas de desarrollo conservan el montaje de raíz que necesitan. En CI se usa una contraseña efímera.

En Git Bash, genera y añade la contraseña a `.env` antes de ejecutar Compose:

```sh
printf 'ATEMPO_POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 32)" >> .env
```

No compartas ni subas ese fichero.

Una sola vez, al clonar:

```sh
git config core.hooksPath .githooks
docker compose run --rm setup
```

La primera vez, `setup` construye la imagen de Docker: tarda unos minutos. Las siguientes, unos segundos.

`setup` instala delivery-workflow para Cursor, Codex y Claude Code en la raíz del proyecto, las dependencias Node de `desktop/`, `docs/storybook/`, `api-router/`, `api-postgresql/`, `api-rustfs/`, `blockend/` y `postgres/` en volúmenes Docker, y `api-sqlite/` en un entorno virtual Linux. Los paquetes Node, el entorno Python y los datos de las APIs viven en volúmenes; las dependencias Linux no llegan a tu carpeta.

Desde entonces, git lanza `setup` después de `git pull`, de cambiar de rama o de un rebase si cambió `apm.yml`, `apm.lock.yaml`, un lockfile de pnpm, `api-sqlite/pyproject.toml`, el script de setup, el entrypoint o el `Dockerfile`. Si cambió el `Dockerfile` o el entrypoint, reconstruye la imagen antes de instalar:

```sh
docker compose build
```

`docker compose run` usa la imagen existente si ya está creada. También puedes reconstruir y ejecutar `setup` en un paso con `docker compose run --build --rm setup`. Si Docker no está en marcha, git avisa y sigue; ejecuta ese comando cuando lo arranques.
Para cambiar de versión de delivery-workflow, cambia la etiqueta en `apm.yml` (por ejemplo, `#v0.1.2` por `#v0.1.3`), lanza `docker compose run --rm setup` y sube `apm.yml` y `apm.lock.yaml` en una pull request `chore`.

Si tu herramienta abre Dev Containers, como VS Code, puedes abrir el proyecto con `.devcontainer/devcontainer.json`: usa la misma imagen. Es opcional.

## Postgres

Instalación y arranque en el ordenador: [postgres/README.md](postgres/README.md). Visor: Drizzle Studio en <https://local.drizzle.studio>. Tests: `createdb atempo_schema_test` y `PGDATABASE=atempo_schema_test sh test/run.sh` desde `postgres/`.

### Con Docker (orquestador)

Necesitas Docker Desktop en marcha, como en [Instalación](#instalación).

Desde la raíz del repositorio:

1. Arranca PostgreSQL y Drizzle Studio:

   ```sh
   docker compose --profile db up -d postgres drizzle-studio
   ```

2. Comprueba que `postgres` está `healthy`:

   ```sh
   docker compose --profile db ps
   ```

3. Comprueba que el esquema está cargado:

   ```sh
   docker compose --profile db exec postgres psql -U atempo -d atempo -c '\dt'
   ```

   No necesitas `psql` en tu ordenador para esto.

4. Abre Drizzle Studio en <https://local.drizzle.studio>. Esa página habla con el servidor del contenedor `drizzle-studio` en <http://localhost:4983>. La primera vez, antes de arrancarlo, ejecuta `docker compose run --rm setup` para instalar las dependencias de `postgres/`.

Si quieres conectarte desde tu ordenador con un cliente propio, usa `localhost:5433` y las credenciales configuradas en `.env`. PostgreSQL 17 comparte `postgres-data` con la API. Si tienes datos de PostgreSQL 16 en el volumen anterior, no lo montes directamente en PostgreSQL 17: haz una copia de seguridad y una migración explícita antes de cambiar de versión.

### Cambiar usuario o contraseña

Configura `ATEMPO_POSTGRES_PASSWORD` en el `.env` ignorado de la raíz; se acepta `POSTGRES_PASSWORD` como alternativa. El usuario y la base son `atempo` por defecto. Compose lee las credenciales para inicializar PostgreSQL y configurar la API.

PostgreSQL aplica el usuario, la contraseña y la base al crear el volumen por primera vez. Cambiar esas variables no modifica un volumen existente; no borres el volumen para actualizar credenciales sin una copia de seguridad.

### Parar

- `docker compose --profile db stop`: para los contenedores y conserva los datos.
- `docker compose --profile db down`: quita los contenedores. Los datos siguen en el volumen.
- Para borrar también los datos, tras `down` lanza `docker volume rm atempo_postgres-data`. La próxima vez Docker crea la base vacía y vuelve a cargar el esquema.

Para instalar PostgreSQL sin Docker, mira [postgres/README.md](postgres/README.md).

## SQLite operativo

Instalación y arranque en el ordenador: [sqlite/README.md](sqlite/README.md). Visor: Datasette en <http://localhost:8001>. Tests: `sh test/run.sh` desde `sqlite/`.

### Con Docker (orquestador)

Necesitas Docker Desktop en marcha, como en [Instalación](#instalación).

Desde la raíz del repositorio:

1. Arranca Datasette. Su servicio `init-db` crea `sqlite/data/operational.sqlite` a partir de `sqlite/schema.sql` solo si el fichero no existe:

   ```sh
   docker compose --profile sqlite up -d datasette
   ```

2. Comprueba que la API responde. Devuelve JSON con las filas de `session`:

   ```sh
   curl http://localhost:8001/operational/session.json
   ```

3. Abre Datasette en <http://localhost:8001> para verlo en el navegador.

Para parar, `docker compose --profile sqlite stop` conserva los datos. `docker compose --profile sqlite down` quita los contenedores, pero no borra el fichero `sqlite/data/operational.sqlite`: para empezar de cero, bórralo a mano. Docker y la versión sin Docker usan el mismo puerto `8001`: no los tengas a la vez.

Para ver cómo instalar `sqlite3` y Datasette sin Docker, mira [sqlite/README.md](sqlite/README.md).

## Blockend

Instalación (una vez) y arranque (cada sesión) en el ordenador: [blockend/README.md](blockend/README.md). Anvil es la cadena (`:8545`). Otterscan es el visor (`:5100`). Tests: `pnpm test` desde `blockend/` (no necesita Anvil).

### Con Docker (orquestador)

Necesitas Docker Desktop en marcha, como en [Instalación](#instalación).

Desde la raíz del repositorio:

1. Arranca Anvil y Otterscan:

   ```sh
   docker compose --profile blockend up -d anvil otterscan
   ```

2. Comprueba que Anvil responde. Devuelve `0x7a69`, que es el chain id 31337:

   ```sh
   curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://localhost:8545
   ```

3. Abre Otterscan en <http://localhost:5100> para ver el log.

Para desplegar el contrato de un curso, sigue [blockend/README.md](blockend/README.md). El deploy se lanza en local con pnpm, contra Anvil. Publica la ABI en `blockend/abi/CourseAttendance.json` y el metadata que Otterscan lee en `blockend/sourcify/`. Recarga la dirección del contrato en Otterscan: la pestaña Contract muestra las funciones.

Para parar, `docker compose --profile blockend stop` o `down`. En los dos casos se pierde el libro: Anvil guarda los datos en memoria. Al volver a arrancar hay que desplegar otra vez el contrato. La dirección puede cambiar, así que actualiza `course.contract_address` en PostgreSQL.

## Justificantes con RustFS

Instalación y arranque en el ordenador: [rustfs/README.md](rustfs/README.md). Visor: <http://localhost:9001/rustfs/console/>. Tests: `sh test/run.sh` desde `rustfs/`, con RustFS en `:9000`.

### Con Docker (orquestador)

Necesitas Docker Desktop en marcha, como en [Instalación](#instalación).

Desde la raíz del repositorio:

1. Arranca RustFS y el servicio que crea el bucket `justifications`:

   ```sh
   docker compose --profile rustfs up -d rustfs create-bucket
   ```

   `create-bucket` espera a que la API responda, crea el bucket si no existe y sale. Para ver su resultado: `docker compose --profile rustfs logs create-bucket`.

2. Comprueba que la API responde:

   ```sh
   curl http://localhost:9000/health
   ```

3. Abre la consola en <http://localhost:9001/rustfs/console/> con `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY` de [rustfs/.env.example](rustfs/.env.example), o las que pongas en `.env`.

Para cambiar las credenciales, copia `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY` de [rustfs/.env.example](rustfs/.env.example) a tu `.env` de la raíz. Son para desarrollo: cámbialas antes de exponer el puerto 9000 a una red.

Para parar, `docker compose --profile rustfs stop` conserva los datos. Con `down` se quitan los contenedores, y los objetos siguen en el volumen `rustfs-data`. Para borrarlos, tras `down`, lanza `docker volume rm atempo_rustfs-data`.

El modelo de los objetos está en [docs/RUSTFS.md](docs/RUSTFS.md). El README de la carpeta, en [rustfs/README.md](rustfs/README.md).

## Pruebas de almacenes

En el host (Git Bash en Windows). Postgres usa `atempo_schema_test`, no `atempo`. RustFS tiene que estar en `:9000`. Hardhat no necesita Anvil.

```sh
createdb atempo_schema_test && PGDATABASE=atempo_schema_test sh postgres/test/run.sh
sh sqlite/test/run.sh
sh rustfs/test/run.sh
cd blockend && pnpm test
```

Compose, contra instancias efímeras. No usan `postgres-data`, `sqlite/data/operational.sqlite` ni `rustfs-data`:

```sh
docker compose run --rm postgres-test
docker compose run --rm sqlite-test
docker compose run --rm rustfs-test
docker compose run --rm blockend pnpm test
```

`postgres-test`, `sqlite-test` y `rustfs-test` van en el perfil `test`. `blockend pnpm test` usa la red interna de Hardhat, no Anvil. Tras cambiar el `Dockerfile`, `docker compose run --build --rm setup` instala también `blockend/`.

## Escritorio

Las comprobaciones se lanzan en Docker, con las versiones del equipo:

```sh
docker compose run --rm desktop pnpm typecheck
docker compose run --rm desktop pnpm lint
```

La forma recomendada de abrir la ventana de Electron es en tu ordenador. Para eso necesitas pnpm 10.33.0 en tu ordenador (`npm install --global pnpm@10.33.0`) e instalar allí sus dependencias, aparte de las de Docker:

```sh
cd desktop
pnpm install
pnpm dev
```

`pnpm typecheck` comprueba los tipos. `pnpm run test:visual` construye la app y ejecuta las pruebas de Playwright con Electron oculto en macOS. Se lanza en tu ordenador, no en Docker. Antes de la suite se comprueba el arnés con el [smoke de escritorio](desktop/README.md#visual-test).

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

La suite del sistema visual sirve `docs/storybook/storybook-static` en `http://127.0.0.1:6006` y lo cierra al terminar, aunque falle. Necesita las dependencias de `docs/storybook/` instaladas en tu ordenador (`pnpm install` en esa carpeta), no solo en Docker, y el puerto 6006 libre: si tienes Storybook en Docker, páralo antes con `docker compose stop storybook`.

Cada pull request a `staging` pasa lint, typecheck y el build de Storybook en GitHub Actions ([ci.yml](.github/workflows/ci.yml)), en cada paquete que cambia. Un paquete es cualquier carpeta con un `pnpm-lock.yaml`, así que uno nuevo entra solo. Si una comprobación falla, «CI / ci» queda en rojo.

### Ventana de Electron desde Docker (experimental)

`desktop-gui` construye la app dentro de Docker y abre su ventana en tu pantalla, a través del servidor X11 de tu ordenador. Es más lenta que `pnpm dev` en el ordenador: no usa la GPU y no recarga al editar. Solo está probada en macOS.

En macOS, una sola vez:

1. Instala XQuartz: `brew install --cask xquartz`, desde una terminal donde puedas escribir tu contraseña.
2. Abre XQuartz. En Ajustes → Seguridad, activa «Permitir conexiones de clientes de red». Cierra XQuartz y ábrelo otra vez.

Cada vez que abras XQuartz, deja entrar a Docker y arranca la app:

```sh
/opt/X11/bin/xhost +localhost
docker compose up desktop-gui
```

Para pararla, `Ctrl+C`. Al terminar, `/opt/X11/bin/xhost -localhost` vuelve a cerrar la pantalla.

En Linux o Windows con WSL2, cambia la pantalla con `ATEMPO_DISPLAY`. Por ejemplo, `ATEMPO_DISPLAY=:0 docker compose up desktop-gui`, además de montar el socket de X11 de tu sistema. Está sin probar.

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

## API-router

```sh
docker compose up api-router
```

El servicio queda en <http://localhost:3000>. `GET /health` debe devolver `{ "status": "ok" }`. La documentación interactiva está en <http://localhost:3000/docs>. Su contenedor monta solo `api-router/`, sus `node_modules` y la caché pnpm; el `.env` de la raíz no queda disponible dentro del servicio. Para pararlo, `Ctrl+C` o `docker compose stop api-router`.

Las comprobaciones se lanzan en Docker:

```sh
docker compose run --rm api-router pnpm typecheck
docker compose run --rm api-router pnpm lint
docker compose run --rm api-router pnpm test
```

Más detalle en [api-router/README.md](api-router/README.md).

## API-postgresql

Desde la raíz, inicia la API y el servicio PostgreSQL compartido:

```sh
docker compose up api-postgresql
```

La API queda en <http://localhost:3001> y PostgreSQL en <http://localhost:5433> desde el ordenador; dentro de Compose, la API se conecta a `postgres:5432`. `GET /health` confirma la conexión y Swagger está en `/docs`. El volumen compartido `postgres-data` conserva la base operativa y la de la API. Ejecuta cada comprobación por separado, por ejemplo `docker compose run --rm api-postgresql pnpm test`. Más detalle en [api-postgresql/README.md](api-postgresql/README.md).

## API-sqlite

`api-sqlite/` es el servicio de persistencia local previsto para la SDK. La SDK todavía está pendiente y no hay integración entre estos servicios. Su base SQLite es distinta de la base local de Electron.

Para usar el servicio en Docker, primero ejecuta `docker compose run --rm setup` y después:

```sh
docker compose up api-sqlite
```

La API queda en <http://localhost:3002>; `/docs` y `/docs-json` documentan el health. Su entorno virtual Linux y la base SQLite persisten en volúmenes separados. Para ejecutar sus pruebas en el contenedor:

```sh
docker compose run --rm api-sqlite /work/api-sqlite/.venv/bin/python -m unittest discover -s tests -v
```

También puedes ejecutarla localmente desde `api-sqlite/`, creando un entorno virtual, instalando el paquete editable y arrancándolo:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m api_sqlite
```

En macOS/Linux usa `python3 -m venv .venv`, `source .venv/bin/activate` y después los mismos comandos `python -m pip` y `python -m api_sqlite`. El servicio escucha en `http://127.0.0.1:3002`; `PORT` cambia el puerto y `SQLITE_DATABASE_URL` cambia la URL SQLAlchemy de SQLite. Por defecto usa `sqlite:///./api-sqlite.sqlite`.

`GET /health` ejecuta `SELECT 1` y responde `{ "status": "ok" }` si SQLite está disponible. Swagger UI está en <http://localhost:3002/docs> y el documento JSON en <http://localhost:3002/docs-json>. No se anuncia cuerpo para el GET. Si se envía JSON, solo se acepta `{}`; campos extra producen `400` antes del acceso a SQLite.

Más detalle en [api-sqlite/README.md](api-sqlite/README.md).

## API-rustfs

Desde la raíz, inicia Express y RustFS:

```sh
docker compose up api-rustfs
```

La API queda en <http://localhost:3003>; RustFS está disponible en los puertos S3 `9000` y consola `9001` desde el ordenador, y la API se conecta a `rustfs:9000` dentro de Compose. El volumen compartido `rustfs-data` conserva los objetos. `/health` sigue comprobando solo que responde la API HTTP; la conexión S3 se verifica por separado en el workflow `.github/workflows/docker-apis.yml`. Swagger está en `/docs/`. Las pruebas se ejecutan en Docker con `docker compose run --rm api-rustfs pnpm test`; typecheck, lint y build usan el mismo patrón. Más detalle en [api-rustfs/README.md](api-rustfs/README.md).

Las cuatro APIs pueden iniciarse juntas con `docker compose up api-router api-postgresql api-sqlite api-rustfs`; Compose inicia PostgreSQL y RustFS como dependencias. El workflow `.github/workflows/docker-apis.yml` valida setup, pruebas, HTTP y persistencia en un runner Ubuntu al abrir o actualizar una pull request hacia `staging`, sin secretos y con permisos de solo lectura.

## Avisos opcionales de PR en Discord

El workflow `.github/workflows/discord-pr-notifications.yml` activa los avisos desde `main` para las PR dirigidas a `staging` y los comentarios de asociación. Usa la acción compartida fijada a un commit y no ejecuta código de la PR. APM no instala este workflow ni lo incorpora a los pasos de los agentes.

Al solicitar al menos dos revisores, el bot publica una línea separadora, el repositorio, el título de la PR, los revisores y el enlace. No incluye el cuerpo de la PR. Muestra los logins de GitHub aunque no encuentre sus cuentas de Discord, y menciona únicamente a quienes tengan una asociación verificada.

Un administrador puede configurar una vez la variable opcional `DISCORD_USER_MAP` en el entorno protegido `Discord-PR-Notifications`, con un JSON como `{"login-github":"ID_DE_DISCORD"}` y un ID numérico real en lugar del marcador. Esta asociación fija tiene prioridad, no caduca y se comprueba contra los miembros del servidor antes de mencionar. Para el resto se conserva la caché cifrada de 48 horas; la búsqueda automática acepta diferencias de mayúsculas en el nombre de usuario de Discord.

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
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Las tres capas del escritorio y el entorno de instalación. |
| [docs/STYLE.md](docs/STYLE.md) | Temas y enlace a la guía visual. |
| [docs/guia](docs/guia/README.md) | Markdown generado desde Storybook. No se versiona. |
| [docs/TREE.md](docs/TREE.md) | Carpetas de `desktop/`, `api-router/`, las APIs de persistencia y los almacenes. |
| [docs/POSTGRES.md](docs/POSTGRES.md) | Modelo del core PostgreSQL. |
| [docs/SQLITE.md](docs/SQLITE.md) | Modelo del SQLite operativo. |
| [docs/RUSTFS.md](docs/RUSTFS.md) | Modelo del bucket de justificantes. |
| [docs/BLOCKEND.md](docs/BLOCKEND.md) | Modelo de Anvil, Hardhat y el contrato. |
| [permanent-data.md](permanent-data.md) | Enlaces entre las cuatro bases. |
| [AGENTS.md](AGENTS.md) | Cómo se trabaja una spec. |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Cómo contribuir: issues, ramas, commits y pull requests. |
