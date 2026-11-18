# Blockend (Anvil + Hardhat)

Uso, configuración y modelo del notario y del contrato de cada curso. Anvil y Otterscan se instalan una vez y se arrancan cada sesión: [blockend/README.md](../blockend/README.md). Compose orquesta los mismos puertos.

Esta carpeta no se abre desde `desktop/` ni desde `api-router/`. Hardhat usa Node como runtime de la herramienta de contratos; no es un backend. Otterscan consulta.

## Qué hay

Un tipo de contrato (`CourseAttendance`). Una instancia por curso. Hereda Ownable de OpenZeppelin: el dueño es el wallet que despliega. El constructor guarda `courseId` (UUID del core) inmutable y el `keccak256` de un token que aporta quien despliega. No copia `name` ni acronym. La matrícula es `person_course` en PostgreSQL.

El estado (`courseId`, sesiones, fichas, hash del token) es `private`. No hay eventos de asistencia. `transferOwnership` y `renounceOwnership` revierten. `owner()` de Ownable se deja.

Solidity no guarda null. Un número o una fecha ausente es `0`. Un texto ausente es `""`. `justification` usa `None` cuando no hay justificación.

Funciones (el primer argumento es el token):

- `getCourseId` / `getSession` / `getRecord` — lectura; exigen el token
- `createSession` / `closeSession` — el cierre es atómico e idempotente; no modifica una sesión ya escrita; exigen dueño y token
- `changeStatus` / `setJustification` — solo la ficha; no tocan la sesión; exigen dueño y token

No hay `updateSession`. No hay `expectedCount`.

El sello de cierre es `closedAt` y `lateAfterMinutes` vía `getSession`. El `transactionHash` de `closeSession` sigue en Anvil y Otterscan. No hay The Graph ni tabla `session_seal`. El token del contrato no es la contraseña de `person`.

Al parar Anvil se pierde el libro.

## Configuración

Anvil JSON-RPC en `localhost:8545`, chain id 31337. Foundry `v1.2.3` en el PC. Otterscan (`v2.8.0`) es una SPA en `localhost:5100`: el navegador llama a Anvil. `experimental` / OTS2 va en `false`. Hardhat compila `contracts/CourseAttendance.sol` y despliega contra Anvil. El deploy lee `COURSE_ID` y `ACCESS_TOKEN` de `blockend/.env` (plantilla: [blockend/.env.example](../blockend/.env.example)). La dirección impresa es `course.contract_address`. El deploy publica la ABI en `blockend/abi/CourseAttendance.json` y el `metadata.json` que Otterscan pide en `blockend/sourcify/contracts/full_match/31337/<dirección>/`. Compose sirve esa carpeta en el propio Otterscan (`/sourcify`). Sin Docker, `pnpm run serve-abi` la sirve en `:5555`. `hardhat node` no implementa `ots`.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
