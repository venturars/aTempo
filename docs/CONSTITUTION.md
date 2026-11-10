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
- **Zustand** guarda el estado de la pantalla en el renderer.
- **SQLite** es la base local. Se abre con `node:sqlite` y la clase `DatabaseSync` en el proceso principal. El login no la usa.
- **pnpm** es el gestor de paquetes de `desktop/`. Las versiones van fijas, sin `^`.

## 3. Dónde seguir

- [STYLE.md](STYLE.md): los dos temas y el enlace a la guía visual.
- [ARCHITECTURE.md](ARCHITECTURE.md): las tres capas de la aplicación.
- [TREE.md](TREE.md): el árbol de carpetas de `desktop/`.
