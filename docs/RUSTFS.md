# RustFS

Uso, configuración y modelo del almacén de justificantes. Cómo se arranca en el ordenador está en [rustfs/README.md](../rustfs/README.md). Compose orquesta el mismo RustFS.

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

El bucket `justifications` se crea con `rustfs/create-bucket.sh` contra `http://127.0.0.1:9000`. Compose llama al mismo script. La API S3 escucha en el puerto 9000; la consola, en el 9001, en la ruta `/rustfs/console/`. Las credenciales son `RUSTFS_ACCESS_KEY` y `RUSTFS_SECRET_KEY`. El binario es RustFS `1.0.3`.

Al subir un objeto, hay que poner `content-type`. Sin él, la consola no sabe si el UUID es un PDF, una imagen u otro tipo.

## Enlaces

El mapa entre esta base y las otras está en [permanent-data.md](../permanent-data.md).
