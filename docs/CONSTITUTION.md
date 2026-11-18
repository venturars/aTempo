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

La SDK de lógica de negocio vivirá en `sdk/` (carpeta pendiente), al mismo nivel que `desktop/` y `api-router/`. El API-router no implementa reglas de negocio; solo delegará en esa SDK.

## 4. Stack de `api-rustfs/`

- **Express 5** expone REST hacia la SDK para persistencia de objetos en RustFS.
- **Cliente npm `minio` (API S3)** habla con RustFS.
- **swagger-ui-express** documenta la API y sirve Swagger UI en `/docs` para pruebas manuales.
- **TypeScript** escribe el servicio.
- **pnpm** es el gestor de paquetes de `api-rustfs/`. Las versiones van fijas, sin `^`.

El API-router no accede a RustFS; la SDK consumirá este servicio cuando exista.

## 5. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): capas del escritorio, del API-router y de las APIs de persistencia.
- [TREE.md](TREE.md): árboles de `desktop/`, `api-router/` y `api-rustfs/`.
