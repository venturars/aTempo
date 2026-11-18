# RustFS

Bucket `justifications`. Cada objeto usa como clave el `documentId` de la ficha en el contrato. El modelo está en [docs/RUSTFS.md](../docs/RUSTFS.md).

Esta carpeta no habla con el escritorio ni con el API-router. Se consulta con la **consola web de RustFS** en el navegador.

Hay dos formas de tener RustFS:

1. **En local (esta guía):** instalas RustFS en tu ordenador y abres la consola en `http://127.0.0.1:9001`.
2. **Con Docker:** [Justificantes con RustFS](../README.md#justificantes-con-rustfs) en la raíz.

**macOS Intel (`x86_64`) queda fuera de esta guía.** Los releases actuales de RustFS no traen binario listo para Intel. Usa Docker, o un Mac Apple Silicon / Linux / Windows.

## Qué camino elegir

| | Homebrew (solo Mac Apple Silicon) | ZIP (binario) | Instalador / aplicativo |
| --- | --- | --- | --- |
| **Qué es** | El servidor vía `brew` | Un ejecutable en una carpeta tuya (`~/rustfs` o `C:\rustfs`) | App o paquete (Launcher en Mac/Windows; DEB/RPM en Linux) |
| **Instalar** | Un comando | Descargar, descomprimir | DMG / `.exe` / `dpkg` o `rpm` |
| **Arrancar** | Script de esta carpeta | Script de esta carpeta | Botón del Launcher, o `systemctl` en Linux |
| **Ver justificantes** | Consola en el navegador (`:9001`) | Igual | Igual |
| **Desinstalar** | `brew uninstall` + borrar datos | Borrar la carpeta | Quitar la app/paquete **y** borrar los datos a mano |
| **Pros** | En Mac ARM es lo más simple; evita el aviso de “archivo dañado” del DMG | Mismo relato en Mac, Linux y Windows; fácil de quitar | Clics en Mac/Windows; en Linux puede ser servicio |
| **Contras** | Solo Mac Apple Silicon; hace falta Homebrew | Terminal | El DMG del Launcher en Mac a menudo lo marca Gatekeeper como “dañado”; los datos no se borran solos |

En **Mac Apple Silicon**, usa **Homebrew**. El Launcher (DMG) es opcional y suele dar problemas con Gatekeeper. En **Linux** y **Windows**, ZIP o el instalador de esa sección.

Enlaces oficiales:

- Homebrew: <https://github.com/rustfs/homebrew-tap>
- Servidor (ZIP, DEB, RPM): <https://github.com/rustfs/rustfs/releases>
- Launcher (Mac / Windows): <https://github.com/rustfs/launcher/releases>
- Documentación: [macOS](https://docs.rustfs.com/en/installation/macos), [Windows](https://docs.rustfs.com/en/installation/windows), [Linux](https://docs.rustfs.com/en/installation/)

Sustituye `<version>` por la versión del release (por ejemplo `1.0.6`).

---

## macOS (Apple Silicon)

Comprueba la arquitectura:

```sh
uname -m
```

Tiene que salir `arm64`. Si sale `x86_64`, esta guía no aplica: usa Docker.

### Opción A — Homebrew (recomendada)

Necesitas [Homebrew](https://brew.sh). Instala el servidor (no es la app gráfica):

```sh
brew install rustfs/homebrew-tap/rustfs
rustfs --version
mkdir -p data
```

Los objetos quedan en `data/` de esta carpeta (ignorada por git).

**Desinstalar Homebrew:**

```sh
brew uninstall rustfs
rm -rf data
```

Luego arranca con [Arrancar en local](#arrancar-en-local-después-de-instalar) (`./scripts/start.sh`).

### Opción B — ZIP

1. En [Releases del servidor](https://github.com/rustfs/rustfs/releases), descarga `rustfs-macos-aarch64-v<version>.zip`.
2. Instala:

```sh
mkdir -p "$HOME/rustfs/bin" data
unzip "$HOME/Downloads/rustfs-macos-aarch64-v<version>.zip" -d "$HOME/rustfs/bin"
chmod +x "$HOME/rustfs/bin/rustfs"
"$HOME/rustfs/bin/rustfs" --help
```

Si el ZIP deja el binario con otro nombre, renómbralo a `rustfs` o apunta `RUSTFS_BIN` en `.env`. Los datos del proyecto van en `rustfs/data/`.

3. **Desinstalar el ZIP:** para el servidor (`Ctrl+C`), borra el binario y los datos:

```sh
rm -rf "$HOME/rustfs" data
```

### Opción C — Launcher / DMG (opcional)

Solo si no puedes usar Homebrew. En muchos Macs, al abrir el DMG macOS dice que el archivo **está dañado** y pide borrarlo. Casi nunca está corrupto: es Gatekeeper (cuarentena) con una app sin notarizar.

1. En [Releases del Launcher](https://github.com/rustfs/launcher/releases), descarga el DMG **AArch64**.
2. Si macOS dice que está dañado, en Terminal (ajusta el nombre del fichero si cambia):

```sh
xattr -d com.apple.quarantine "$HOME/Downloads/rustfs-launcher-macos-aarch64-latest.dmg"
```

Luego abre el DMG otra vez. Si al copiar la app a Aplicaciones vuelve el aviso:

```sh
xattr -cr "/Applications/RustFS Launcher.app"
```

3. Crea la carpeta de datos en esta carpeta del repo: `mkdir -p data`.
4. Abre el Launcher y configura:
   - Data Path: la carpeta `rustfs/data` del repo (con el selector de carpetas)
   - Host: `127.0.0.1`
   - API Port: `9000`
   - **Console Endpoint: activado**
   - Console Port: `9001`
   - Access Key / Secret Key: las de [`.env.example`](.env.example) (`atempo` / `atempoatempo`) o las tuyas
5. Pulsa **Launch RustFS**.

**Parar:** Stop RustFS en el Launcher. Cerrar la ventana no basta: **Quit** en el icono de la barra de menú.

**Desinstalar el Launcher:**

1. Quit del Launcher.
2. Arrastra RustFS Launcher a la Papelera (solo quita la app).
3. Borra los datos del repo: `rm -rf data`.

---

## Linux

### Opción A — ZIP (recomendada)

1. En [Releases del servidor](https://github.com/rustfs/rustfs/releases), elige el ZIP de tu CPU:
   - x86_64: `rustfs-linux-x86_64-gnu-v<version>.zip` (o `musl` si tu sistema es musl)
   - ARM64: `rustfs-linux-aarch64-gnu-v<version>.zip` (o `musl`)
2. Instala:

```sh
mkdir -p "$HOME/rustfs/bin" data
unzip ~/Downloads/rustfs-linux-*-v<version>.zip -d "$HOME/rustfs/bin"
chmod +x "$HOME/rustfs/bin/rustfs"
"$HOME/rustfs/bin/rustfs" --help
```

3. **Desinstalar el ZIP:** `Ctrl+C` si está en marcha, luego `rm -rf "$HOME/rustfs" data`.

### Opción B — DEB o RPM (paquete)

Pensado para dejar RustFS como servicio del sistema (`systemd`). Más cómodo si quieres que arranque con la máquina; más trabajo al quitarlo del todo.

1. Descarga el `.deb` o `.rpm` del mismo [release](https://github.com/rustfs/rustfs/releases) (gnu, amd64 o arm64).
2. Instala, por ejemplo:

```sh
# Debian / Ubuntu
sudo dpkg -i rustfs_*_amd64.deb

# Fedora / RHEL
sudo rpm -i rustfs-*.rpm
```

3. Edita `/etc/default/rustfs`: credenciales, `RUSTFS_ADDRESS`, `RUSTFS_CONSOLE_ADDRESS`, `RUSTFS_CONSOLE_ENABLE=true` y la ruta de datos. Sigue la [documentación de Linux](https://docs.rustfs.com/en/installation/).
4. Arranca: `sudo systemctl start rustfs` (y `enable` si quieres inicio automático).

**Desinstalar el paquete:**

```sh
# Debian / Ubuntu
sudo systemctl stop rustfs
sudo apt remove rustfs

# Fedora / RHEL
sudo systemctl stop rustfs
sudo dnf remove rustfs
```

Quita también a mano la carpeta de datos y, si quedan, `/etc/default/rustfs` y logs bajo `/var/log/rustfs/`. El gestor de paquetes **no** borra tus objetos.

---

## Windows

### Opción A — ZIP (recomendada)

1. En [Releases del servidor](https://github.com/rustfs/rustfs/releases), descarga `rustfs-windows-x86_64-v<version>.zip`.
2. En PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path C:\rustfs\bin
New-Item -ItemType Directory -Force -Path data
Expand-Archive -Path "$HOME\Downloads\rustfs-windows-x86_64-v<version>.zip" -DestinationPath C:\rustfs\bin -Force
Set-Location C:\rustfs\bin
.\rustfs.exe --help
```

Ejecuta el `New-Item ... data` desde la carpeta `rustfs/` del repo. Si el ejecutable queda en una subcarpeta, muévelo a `C:\rustfs\bin\rustfs.exe` o define `RUSTFS_BIN` en `.env`.

3. **Desinstalar el ZIP:** `Ctrl+C` en la ventana del servidor, borra `C:\rustfs` y la carpeta `data` del repo.

### Opción B — Launcher (instalador)

1. En [Releases del Launcher](https://github.com/rustfs/launcher/releases), descarga el instalador Windows x86-64.
2. Ejecútalo y abre RustFS Launcher.
3. Desde `rustfs/` del repo: `New-Item -ItemType Directory -Force -Path data`.
4. Configura Host `127.0.0.1`, API `9000`, **consola activada** en `9001`, credenciales de desarrollo, Data Path a la carpeta `rustfs\data` del repo.
5. **Launch RustFS**.

**Parar:** Stop en el Launcher; **Quit** en el icono de la bandeja (cerrar la ventana no detiene el servidor).

**Desinstalar el Launcher:**

1. Quit del Launcher.
2. Desinstala “RustFS Launcher” desde Configuración → Aplicaciones (o Agregar o quitar programas).
3. Borra a mano la carpeta `data` del repo.

---

## Usar RustFS en local (después de instalar)

Esta sección asume que **ya instalaste** RustFS (Homebrew, ZIP, Launcher o DEB/RPM). Aquí solo lo pones en marcha, creas el bucket y abres la pantalla para ver los justificantes.

Objetivo final: tener el servidor escuchando y ver el bucket `justifications` en el navegador.

### 1. Prepara el `.env` de esta carpeta

Desde la carpeta `rustfs/` del repo:

```sh
cp .env.example .env
```

Con las rutas por defecto del README no hace falta tocar nada. Si instalaste el binario o los datos en otro sitio, edita `RUSTFS_BIN` y `RUSTFS_DATA` en `.env`.

### 2. Enciende el servidor

Elige **solo** el bloque que corresponda a cómo instalaste. No todos los caminos usan `pnpm`:

| Cómo instalaste | Cómo enciendes |
| --- | --- |
| Homebrew o ZIP | `pnpm start` (abajo) |
| Launcher (app) | Botón Launch en la app (no uses `pnpm start`) |
| DEB / RPM | `systemctl` (abajo) |

#### Homebrew o ZIP → `pnpm start`

Vale en Mac, Linux y Windows. Arranca el binario de RustFS (Homebrew en el PATH, o el ZIP en la ruta del `.env`).

En `rustfs/`:

```sh
pnpm start
```

La terminal se queda ocupada. Verás la API en `9000` y la consola en `9001`. **No la cierres** mientras uses RustFS. Para apagar: `Ctrl+C`.

No hace falta `chmod`: `pnpm start` lanza el script con `bash` o PowerShell.

#### Launcher (app en Mac o Windows)

No uses `pnpm start`. Abre **RustFS Launcher**, comprueba que la consola está activada (puerto `9001`) y pulsa **Launch RustFS**. Para apagar: **Stop**, y luego **Quit** en el icono de la barra / bandeja.

#### DEB o RPM (Linux)

No uses `pnpm start` (el servicio lo gestiona systemd):

```sh
sudo systemctl start rustfs
sudo systemctl status rustfs
```

Para apagar: `sudo systemctl stop rustfs`.

### 3. Comprueba que responde

Con el servidor encendido, en otra terminal:

```sh
curl http://127.0.0.1:9000/health
```

Si responde bien, sigue. Si falla, el servidor no está en marcha o usa otro puerto.

### 4. Crea el bucket `justifications` (solo la primera vez)

Con el servidor aún encendido, en `rustfs/`, una de estas dos formas:

```sh
pnpm install
pnpm create-bucket
```

O, si tienes AWS CLI y las variables de `.env` / `.env.example` cargadas (`AWS_ACCESS_KEY_ID` = `RUSTFS_ACCESS_KEY`, etc.):

```sh
sh create-bucket.sh
```

Compose usa ese mismo `create-bucket.sh`. Si el bucket ya existe, no pasa nada. También puedes crearlo a mano desde la consola del paso siguiente.

### 5. Abre la consola en el navegador

1. Ve a <http://127.0.0.1:9001>.
2. Entra con usuario `atempo` y contraseña `atempoatempo` (o las de tu `.env`).
3. Abre el bucket `justifications`.

Ahí ves, subes y descargas justificantes. La clave de cada objeto es el `documentId`. Al subir, indica el `content-type` (por ejemplo PDF o imagen).

### Resumen del día a día

| Qué quieres | Qué haces |
| --- | --- |
| Encender (Homebrew / ZIP) | `pnpm start` |
| Encender (Launcher) | Launch en la app |
| Encender (DEB/RPM) | `sudo systemctl start rustfs` |
| Crear bucket | `pnpm create-bucket` (servidor ya encendido) |
| Ver justificantes | Navegador → <http://127.0.0.1:9001> |
| Apagar (`pnpm start`) | `Ctrl+C` en esa terminal |
| Apagar (Launcher) | Stop + Quit |
| Apagar (DEB/RPM) | `sudo systemctl stop rustfs` |

---

## Credenciales

[`.env.example`](.env.example) documenta `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, puertos y rutas. Son solo para desarrollo: cámbialas antes de exponer el puerto 9000 a una red.

## Pruebas

Con RustFS en marcha en `http://127.0.0.1:9000` y AWS CLI en el PATH, desde esta carpeta:

```sh
sh test/run.sh
```

Desde la raíz, contra un RustFS efímero en Docker (no usa `data/` ni el volumen `rustfs-data`):

```sh
docker compose run --rm rustfs-test
```
