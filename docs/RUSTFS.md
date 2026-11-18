# RustFS

Uso, configuración y modelo del almacén de justificantes. Instalación local y arranque: [rustfs/README.md](../rustfs/README.md). Compose orquesta el mismo RustFS: [raíz](../README.md#justificantes-con-rustfs).

Esta base no se abre desde `desktop/` ni desde `api-router/`. La consola de RustFS consulta.

## Qué hay

No hay tablas. Un bucket y un objeto por archivo:

- Bucket: `justifications`
- Clave: `documentId` (el mismo UUID que guarda la ficha en el contrato). Sin `courseId` ni `studentId` en la ruta
- Cuerpo: bytes del justificante
- Metadato: `content-type` (MIME; la clave es un UUID sin extensión)

El objeto no se sobrescribe ni se borra. Un justificante nuevo es un `documentId` nuevo. Un `rejected` no admite segundo archivo.

La cadena no guarda el hash del archivo. La integridad del objeto es la del ETag que devuelve RustFS. Si no hay archivo, `documentId` en el contrato es `""`.

## Configuración

La API S3 escucha en el puerto 9000; la consola, en el 9001 (en Docker suele ser `/rustfs/console/`; en local, `http://127.0.0.1:9001`). El bucket `justifications` se crea con `rustfs/create-bucket.sh` o `pnpm create-bucket`; Compose llama al script. Las credenciales son `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`.

Al subir un objeto, hay que poner `content-type`. Sin él, la consola no sabe si el UUID es un PDF, una imagen u otro tipo.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
