# Constitución de aTempo

Reglas básicas del proyecto. El detalle de producto sigue en [principles.md](../principles.md). Aquí solo queda lo que ya está decidido para construir.

## 1. Aplicación de escritorio

aTempo de escritorio es la aplicación del profesor. Sirve para registrar la asistencia de los alumnos de una clase.

## 2. Stack de `desktop/`

- **Electron** abre la ventana de escritorio.
- **React** pinta las pantallas.
- **Node** ejecuta el proceso principal de Electron.
- **Tailwind** pone los estilos con clases.
- **daisyUI** aporta los componentes (campo, botón, alert) encima de Tailwind.
- **TanStack Router** elige la pantalla según la ruta del hash.
- **Zustand** guarda el estado de la pantalla en el renderer.
- **SQLite** es la base local. Se abre con `node:sqlite` y la clase `DatabaseSync` en el proceso principal.
- **pnpm** es el gestor de paquetes de `desktop/`. Las versiones van fijas, sin `^`.

## 3. Stack de `api-router/`

- **NestJS 11** expone REST y transforma las peticiones de los frontends.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-router/`. Las versiones van fijas, sin `^`.

La SDK de lógica de negocio vive en `sdk/`, al mismo nivel que `desktop/` y `api-router/`. El API-router no implementa reglas de negocio: autentica con Auth0 y delega en esa SDK. Tras un login o `me` correcto, la SDK identifica al usuario por email y llama a `api-postgresql`.

## 4. Stack de `api-postgresql/`

- **NestJS 11** expone la persistencia que usará la SDK para leer y escribir en PostgreSQL.
- **pg** abre la conexión y comprueba que la base responde.
- **@nestjs/swagger** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-postgresql/`. Las versiones van fijas, sin `^`.

Este servicio no implementa reglas de negocio. El API-router no habla con PostgreSQL. El escritorio no llama a este servicio.

## 5. Stack de `api-rustfs/`

- **Express 5** expone REST hacia la SDK para persistencia de objetos en RustFS.
- **Cliente npm `minio` (API S3)** habla con RustFS.
- **swagger-ui-express** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-rustfs/`. Las versiones van fijas, sin `^`.

El API-router no accede a RustFS; la SDK consumirá este servicio cuando exista.

## 6. Stack de `api-sqlite/`

- **Flask** expone el servicio local de persistencia.
- **Pydantic** valida los modelos de entrada y salida.
- **SQLAlchemy Core** gestiona conexiones y consultas SQLite sin esquema de dominio.
- **Flasgger** sirve Swagger UI y OpenAPI para comprobar el servicio.
- **Python** ejecuta el paquete, que tiene sus dependencias fijadas en `api-sqlite/pyproject.toml`.

`api-sqlite/` está detrás de la SDK: el `api-router` delega en la SDK y esta accede a las APIs de persistencia. La SQLite de este servicio es independiente de `desktop/atempo.sqlite`.

## 7. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): capas del escritorio, flujo de `api-router/` y las APIs de persistencia, y los almacenes; se prevén la SDK y más APIs.
- [TREE.md](TREE.md): árboles de `desktop/`, `api-router/`, `sdk/`, `api-postgresql/`, `api-rustfs/`, `api-sqlite/` y los almacenes.
