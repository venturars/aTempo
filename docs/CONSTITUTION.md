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
- La fuente de verdad visual es `docs/storybook`. El markdown de `docs/guia/` sale de ahí con `pnpm guide` y no se versiona. Hay que lanzarlo cada vez que cambia Storybook. Los agentes leen ese markdown.
- `atempo-oscuro` usa Geist y es el tema por defecto. `atempo-claro` usa Inter.
- Las pantallas usan clases de daisyUI. No hay un paquete de componentes.
- [ARCHITECTURE.md](ARCHITECTURE.md): las tres capas de la aplicación.
- [TREE.md](TREE.md): el árbol de carpetas de `desktop/`.
