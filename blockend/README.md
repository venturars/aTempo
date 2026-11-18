# Blockend (Anvil + Hardhat)

Un contrato Solidity por curso, Ownable y con token. Anvil es el notario. Hardhat compila, testea y despliega. Otterscan consulta las transacciones. El modelo está en [docs/BLOCKEND.md](../docs/BLOCKEND.md).

Esta carpeta no habla con el escritorio ni con el API-router. Hardhat usa Node como runtime de la herramienta de contratos; no es un backend de aTempo.

Tres piezas:

| Pieza | Puerto | Qué es |
| --- | --- | --- |
| Anvil | 8545 | La cadena. Si lo paras, se pierde el libro. |
| Otterscan | 5100 | El visor. El navegador pregunta a Anvil. |
| Hardhat | — | Compila, testea y despliega contra Anvil. |

`pnpm exec hardhat node` no sustituye a Anvil: no implementa `ots`, y Otterscan no funciona contra él.

Compose orquesta Anvil y Otterscan. Pasos: [Blockend con Docker](../README.md#blockend-con-docker) en la raíz.

## Pruebas

Hardhat corre la suite en su red interna. No necesita Anvil. Desde esta carpeta, con pnpm 10.33.0:

```sh
pnpm install
pnpm test
```

Compose: `docker compose run --rm blockend pnpm test`.

## Una vez: Foundry (Anvil)

Anvil es un binario de Foundry **v1.2.3**. No viene con Node ni con este repo. `foundryup` no corre en PowerShell ni en cmd: instala en **Git Bash**.

```sh
curl -L https://foundry.paradigm.xyz | bash
export PATH="$PATH:$HOME/.foundry/bin"
foundryup --install v1.2.3
anvil --version
```

`curl | bash` solo deja `foundryup` en `~/.foundry/bin`. Anvil llega con `foundryup --install v1.2.3`. En Git Bash de Windows a menudo no hay `~/.bashrc`. Persiste el PATH:

```sh
echo 'export PATH="$PATH:$HOME/.foundry/bin"' >> ~/.bash_profile
```

Cierra Git Bash y ábrelo otra vez. `anvil --version` tiene que imprimir `1.2.3`.

PowerShell, esta sesión:

```powershell
$env:Path += ";$env:USERPROFILE\.foundry\bin"
anvil --version
```

Para que PowerShell lo conserve: Variables de entorno de Windows → Path de tu usuario → `C:\Users\<tu-usuario>\.foundry\bin`.

Atajo sin foundryup: zip `foundry_v1.2.3_win32_amd64.zip` de [releases/tag/v1.2.3](https://github.com/foundry-rs/foundry/releases/tag/v1.2.3). Extrae `anvil.exe` a esa carpeta y añádela al PATH.

## Una vez: Otterscan

Otterscan no entra en este repo. Clone **fuera** de aTempo, etiqueta `v2.8.0`:

```sh
git clone --branch v2.8.0 --depth 1 https://github.com/otterscan/otterscan.git
cd otterscan
npm ci
```

`experimental` / OTS2 va en `false`: Anvil no implementa esos métodos.

## Cada vez: cadena y visor

1. Anvil, ventana abierta:

```sh
anvil --host 127.0.0.1 --port 8545 --chain-id 31337
```

2. Otterscan, otra terminal, en el clone. Git Bash:

```sh
VITE_CONFIG_JSON='{"erigonURL":"http://127.0.0.1:8545","experimental":false}' npx vite --port 5100
```

PowerShell:

```powershell
$env:VITE_CONFIG_JSON = '{"erigonURL":"http://127.0.0.1:8545","experimental":false}'
npx vite --port 5100
```

3. Abre <http://localhost:5100>. Chain id `31337` y el bloque 0 confirman que el visor habla con Anvil.

No se vuelve a hacer `curl | bash` ni `npm ci` salvo que borres `~/.foundry`, el clone o cambies de versión.

Al parar Anvil se pierde el libro. La próxima sesión la cadena vuelve vacía.

## Contrato en local

Anvil tiene que estar en `localhost:8545` (chain id 31337), que es lo que usa `hardhat.config.cjs`. Desde esta carpeta:

```sh
pnpm install
pnpm test
```

Git Bash:

```sh
ACCESS_TOKEN=<secreto> COURSE_ID=11111111-1111-1111-1111-111111111111 pnpm run deploy
```

PowerShell:

```powershell
$env:ACCESS_TOKEN = "<secreto>"
$env:COURSE_ID = "11111111-1111-1111-1111-111111111111"
pnpm run deploy
```

Quien despliega inventa el token. El script guarda `keccak256` de ese texto en el constructor e imprime solo la dirección. Esa dirección es `course.contract_address` en PostgreSQL. Recarga Otterscan: aparece la transacción.
