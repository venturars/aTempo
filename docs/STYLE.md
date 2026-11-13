# Estilo

La fuente de verdad visual es [docs/storybook](storybook/README.md). El markdown que leen los agentes está en [docs/guia](guia/README.md). Sale de Storybook y no se versiona. Desde `docs/storybook`, `pnpm guide` lo vuelve a generar. Hay que lanzarlo cada vez que cambia Storybook.

Para ver la guía en el navegador, desde `docs/storybook`: `pnpm storybook`.

Hay dos temas de daisyUI. `atempo-oscuro` es el de defecto y usa Geist. `atempo-claro` usa Inter. Las fuentes están en el repositorio, con licencia OFL.

Los colores salen del tema. No se escribe un color a mano. El escritorio importa ese tema desde `docs/storybook/src/system.css`.

Las pantallas usan las clases de daisyUI. El calendario es de React Day Picker 9.14.0, con la clase `react-day-picker` de daisyUI y los colores del tema.

Las reglas de la guía siguen la [guía de Apple](https://developer.apple.com/design/human-interface-guidelines).
