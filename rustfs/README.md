# RustFS

Bucket `justifications`. Cada objeto usa como clave el `documentId` de la ficha en el contrato. El modelo está en [docs/RUSTFS.md](../docs/RUSTFS.md).

Esta carpeta no habla con el escritorio ni con el API-router. Se consulta con la consola de RustFS.

Compose orquesta el mismo servidor. Pasos: [Justificantes con RustFS](../README.md#justificantes-con-rustfs) en la raíz.

## Pruebas

Con RustFS en marcha en `http://127.0.0.1:9000` y AWS CLI en el PATH, desde esta carpeta:

```sh
sh test/run.sh
```

Compose, contra una instancia efímera (no usa `data/` ni el volumen `rustfs-data`):

```sh
docker compose run --rm rustfs-test
```

## Una vez: instalar RustFS 1.0.3

El binario no va en este repo. Baja la versión **1.0.3** de [github.com/rustfs/rustfs/releases/tag/1.0.3](https://github.com/rustfs/rustfs/releases/tag/1.0.3).

- Windows: `rustfs-windows-x86_64-v1.0.3.zip`. Extrae `rustfs.exe`.
- macOS Apple silicon: `rustfs-macos-aarch64-v1.0.3.zip`.
- Linux x86_64: `rustfs-linux-x86_64-musl-v1.0.3.zip`.

macOS Intel no tiene binario 1.0.3: usa Compose o compila desde el fuente.

También hace falta [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) para crear el bucket y para `test/run.sh`.

Los datos van en `data/` (fuera de git). Crea la carpeta.

## Cada vez: arrancar

Carga las variables de [`.env.example`](.env.example) (`RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`). Desde esta carpeta, con el binario en el PATH:

```sh
mkdir -p data
set -a
. ./.env.example
set +a
rustfs server --address 127.0.0.1:9000 --console-enable true --console-address 127.0.0.1:9001 data
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path data | Out-Null
Get-Content .env.example | ForEach-Object {
  if ($_ -match '^(?<name>[^=]+)=(?<value>.*)$') {
    Set-Item -Path "Env:$($matches.name)" -Value $matches.value
  }
}
rustfs server --address 127.0.0.1:9000 --console-enable true --console-address 127.0.0.1:9001 data
```

En otra terminal, mismas variables para AWS CLI (`AWS_ACCESS_KEY_ID` = `RUSTFS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY` = `RUSTFS_SECRET_KEY`, `AWS_DEFAULT_REGION=us-east-1`) y:

```sh
sh create-bucket.sh
```

## Visor

Consola: <http://localhost:9001/rustfs/console/>. Usuario y contraseña son `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`. Tiene que existir el bucket `justifications`.

Para parar, `Ctrl+C` en la terminal de `rustfs`. Los objetos siguen en `data/`.
