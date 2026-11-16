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

## 3. API de `backend/`

- **Node.js 24** ejecuta el servidor HTTP.
- **NestJS 11** organiza la API en módulos, controladores y servicios.
- **TypeScript** usa modo estricto.
- **pnpm 10.33.0** instala las dependencias; las versiones van fijas.
- La API publica el prefijo `/api`, configura variables de entorno y valida globalmente los DTO.
- `GET /api/health` devuelve el estado básico del servidor.
- Los módulos iniciales son `auth`, `users`, `organizations`, `courses`, `sessions` y `attendance`.
- Auth0 y la base de datos del servidor están pendientes de definición e integración.
- `.env` es opcional: el puerto predeterminado es 3000. Para cambiarlo, se crea localmente con `PORT=<puerto>`; Git lo ignora.

## 4. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): arquitectura del escritorio y del backend.
- [TREE.md](TREE.md): el árbol de carpetas de `desktop/` y `backend/`.
