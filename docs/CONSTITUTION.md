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

## 4. Stack de `api-sqlite/`

- **Flask** expone el servicio local de persistencia.
- **Pydantic** valida los modelos de entrada y salida.
- **SQLAlchemy Core** gestiona conexiones y consultas SQLite sin esquema de dominio.
- **Flasgger** sirve Swagger UI y OpenAPI para comprobar el servicio.
- **Python** ejecuta el paquete, que tiene sus dependencias fijadas en `api-sqlite/pyproject.toml`.

`api-sqlite/` está detrás de la SDK: el `api-router` delega en la SDK y esta accede a las APIs de persistencia. La SQLite de este servicio es independiente de `desktop/atempo.sqlite`.

## 5. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): capas del escritorio y del API-router.
- [TREE.md](TREE.md): árboles de `desktop/` y `api-router/`.
