# PostgreSQL core

Tablas permanentes de aTempo: `organization`, `person`, `course`, `person_course`, `role` y `person_role`. El modelo está en [docs/POSTGRES.md](../docs/POSTGRES.md).

Esta carpeta no habla con el escritorio ni con el API-router. Se consulta con `psql` o con un cliente visual, por ejemplo Drizzle Studio ([Ver las tablas con Drizzle Studio](#ver-las-tablas-con-drizzle-studio)). Compose orquesta el mismo PostgreSQL. Pasos: [Postgres con Docker](../README.md#postgres-con-docker) en la raíz.

El esquema está en `init/01_schema.sql`. Una base ya creada no vuelve a ejecutar esa carpeta: los índices `lower(email)` y `lower(contract_address)` se aplican con `psql -d atempo -f init/02_unique_lower.sql`. Ese script falla si ya hay duplicados que solo se diferencian en mayúsculas.

## Pruebas

Contra una base de prueba, no contra `atempo`. Desde esta carpeta:

```sh
createdb atempo_schema_test
PGDATABASE=atempo_schema_test sh test/run.sh
```

Windows:

```sh
createdb -U postgres atempo_schema_test
PGDATABASE=atempo_schema_test PGUSER=postgres sh test/run.sh
```

Compose, contra una Postgres efímera (no usa el volumen `postgres-data`):

```sh
docker compose run --rm postgres-test
```

## Con PostgreSQL

Necesitas PostgreSQL en tu ordenador. Si ya lo tienes, salta a [Pasos](#pasos).

### ¿Ya tienes PostgreSQL?

Comprueba si `psql` está instalado:

```sh
psql --version
```

Si sale una versión (por ejemplo, `psql (PostgreSQL) 16.x`), ya lo tienes: no instales nada y ve a [Pasos](#pasos). Si el comando no existe, instálalo con la sección de tu sistema.

### Instalar (solo si no lo tienes)

**macOS**, con [Homebrew](https://brew.sh):

```sh
brew install postgresql@16
brew services start postgresql@16
```

Homebrew no pone las herramientas en el `PATH`. Para usar `psql` y `createdb`, añade esta línea a tu `~/.zshrc` y abre una terminal nueva:

```sh
export PATH="$(brew --prefix)/opt/postgresql@16/bin:$PATH"
```

**Linux**, en Debian o Ubuntu:

```sh
sudo apt update
sudo apt install postgresql
sudo -u postgres createuser --superuser "$USER"
```

El servicio arranca solo. El último comando crea un usuario de PostgreSQL con tu mismo nombre, para que `createdb` funcione sin contraseña. En otras distribuciones, mira las [instrucciones oficiales](https://www.postgresql.org/download/linux/).

**Windows**: descarga el instalador de [postgresql.org/download/windows](https://www.postgresql.org/download/windows/). Deja marcada la opción «Command Line Tools» para tener `psql` y `createdb` en el `PATH`. Anota la contraseña que pongas al usuario `postgres`: los comandos la pedirán. El puerto por defecto es el `5432`.

### Pasos

Desde esta carpeta, `postgres/`:

```sh
createdb atempo
psql -d atempo -f init/01_schema.sql
psql -d atempo -c '\dt'
```

En Windows, el usuario es `postgres`:

```sh
createdb -U postgres atempo
psql -U postgres -d atempo -f init/01_schema.sql
```

Si `createdb` dice que la base ya existe, bórrala con `dropdb atempo` (en Windows, `dropdb -U postgres atempo`) y repite los pasos.

Para conectarte: `psql -d atempo`.

Para parar el servidor:

- macOS: `brew services stop postgresql@16`
- Linux: `sudo systemctl stop postgresql`
- Windows: desde el instalador o la aplicación «Servicios», para el servicio de PostgreSQL.

## Visor: Drizzle Studio

Drizzle Studio es una interfaz de navegador para ver las tablas de la base. Corre en tu ordenador, no pide cuenta y lee la base que pongas en `DATABASE_URL`. Necesitas Node 24, el mismo que pide el resto del repositorio, y la base `atempo` de los [pasos](#pasos).

### Instalar las dependencias

Una sola vez, desde `postgres/`:

```sh
pnpm install
```

Necesitas pnpm instalado en tu ordenador. Cualquier versión reciente sirve: al estar en esta carpeta, pnpm usa la versión que fija `package.json` (10.33.0).

### Arrancar

macOS y Linux, con la base local de esta guía:

```sh
pnpm studio
```

Si tu usuario de PostgreSQL necesita contraseña o es otro, define la conexión antes del comando:

```sh
DATABASE_URL="postgres://usuario:CONTRASENA@localhost:5432/atempo" pnpm studio
```

Windows, en PowerShell:

```powershell
$env:DATABASE_URL="postgres://postgres:CONTRASENA@localhost:5432/atempo"
pnpm studio
```

Cuando arranca, imprime `Drizzle Studio is up and running on https://local.drizzle.studio`. Abre esa dirección en el navegador. La página se carga desde `local.drizzle.studio`, y habla con un servidor que corre en tu ordenador, en `127.0.0.1:4983`. El script fija `--host 127.0.0.1`, así que otros equipos de la red no pueden conectarse a esa base.

Para parar, pulsa `Ctrl+C` en la terminal. Si el puerto 4983 está ocupado, usa otro con `pnpm studio --port 4984`.

La configuración está en [drizzle.config.ts](drizzle.config.ts). Si no defines `DATABASE_URL`, usa `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_HOST` cuando están; si no, `postgres://localhost:5432/atempo`.
