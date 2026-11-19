# SQLite operativo

Copia de fichaje y de `status` durante la ventana: tablas `session` y `attendance`. El modelo está en [docs/SQLITE.md](../docs/SQLITE.md).

Esta carpeta no habla con el escritorio ni con el API-router. El `atempo.sqlite` del profesor es otra base. Se consulta con `sqlite3` o con Datasette.

El esquema está en `schema.sql`. La base se guarda en `data/operational.sqlite`, que no va a git.

Compose orquesta el mismo Datasette. Pasos: [SQLite operativo con Docker](../README.md#sqlite-operativo-con-docker) en la raíz.

## Pruebas

Desde esta carpeta, contra un fichero temporal (no escribe `data/operational.sqlite`):

```sh
sh test/run.sh
```

Compose:

```sh
docker compose run --rm sqlite-test
```

## Sin Docker

Necesitas `sqlite3` en tu ordenador. Si ya lo tienes, salta a [Pasos](#pasos-sin-docker).

### ¿Ya tienes sqlite3?

```sh
sqlite3 --version
```

Si sale una versión, ya lo tienes: ve a [Pasos](#pasos-sin-docker). Si el comando no existe, instálalo con la sección de tu sistema.

### Instalar (solo si no lo tienes)

**macOS**: `sqlite3` viene con el sistema. Si no aparece, instálalo con Homebrew:

```sh
brew install sqlite
```

**Linux**, en Debian o Ubuntu:

```sh
sudo apt update
sudo apt install sqlite3
```

**Windows**: descarga las herramientas de línea de comandos («sqlite-tools») desde [sqlite.org/download.html](https://www.sqlite.org/download.html). Descomprímelas y añade la carpeta al `PATH`.

### Pasos sin Docker

Desde esta carpeta, `sqlite/`:

```sh
mkdir -p data
sqlite3 data/operational.sqlite < schema.sql
sqlite3 data/operational.sqlite '.tables'
```

Si `data/operational.sqlite` ya existe, no vuelvas a cargar el esquema: fallaría porque las tablas ya están. Para empezar de cero, borra antes el fichero con `rm data/operational.sqlite`.

Para consultarla desde la terminal: `sqlite3 data/operational.sqlite`. Para salir, `.quit`.

#### Datasette, visor web sin Docker

Datasette es un visor web en Python. Usa la misma versión que Docker. Se instala en `.venv/`, dentro de esta carpeta: no añade nada al sistema ni al `PATH`, y `.venv/` no va a git. Necesitas [uv](https://docs.astral.sh/uv/) y Python 3.12. Esta versión no funciona con Python 3.14 ni 3.15, y necesita `setuptools` anterior a la 81 porque importa `pkg_resources`. Desde esta carpeta:

```sh
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python "setuptools<81" datasette==0.65.1
.venv/bin/datasette data/operational.sqlite --port 8001
```

Si no tienes Python 3.12, `uv` lo descarga a su carpeta de usuario, no al sistema ni al `PATH`.

Windows, PowerShell, desde esta carpeta:

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe "setuptools<81" datasette==0.65.1
.venv\Scripts\datasette.exe data\operational.sqlite --port 8001
```

## Visor

Abre <http://localhost:8001>. Para parar, `Ctrl+C`. Docker usa el mismo puerto `8001`: no tengas los dos a la vez.
