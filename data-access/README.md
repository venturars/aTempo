# data-access

Paquetes librería de acceso a datos de aTempo. Carpeta en la raíz, hermana de `desktop/`, `sdk/` y `api-rustfs/`. `sdk/` une el API-router con las `api-xxx`; `data-access/` une las `api-xxx` con el almacén. No son servicios HTTP. No entran en Docker Compose ni en `docker/setup.sh`. Cada paquete se instala y se prueba en el ordenador.

## rustfs

`data-access/rustfs/` es el SDK TypeScript de justificantes. Nombre npm: `atempo-domain-rustfs`. Cliente S3: `@aws-sdk/client-s3` 3.943.0.

El flujo de producto es Frontend → `api-rustfs` → `data-access/rustfs` → RustFS. Este paquete abre el almacén. `api-rustfs` aún no importa el paquete; Express sigue con `minio`.

La API pública es RORO: `check()`, `putJustification()`, `getJustification()` y `justificationExists()`. El `S3Client` no se exporta. Los tests sustituyen el driver S3: RustFS no tiene que estar en marcha.

Instalación y comprobaciones: [data-access/rustfs/README.md](rustfs/README.md).
