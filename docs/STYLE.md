# Estilo

La fuente de verdad visual es [docs/storybook](storybook/README.md). El markdown que leen los agentes está en [docs/guia](guia/README.md). Sale de Storybook y no se versiona. Desde `docs/storybook`, `pnpm guide` lo vuelve a generar. Hay que lanzarlo cada vez que cambia Storybook.

Para ver la guía en el navegador, desde `docs/storybook`: `pnpm storybook`.

Hay dos temas de daisyUI. `atempo-oscuro` es el de defecto y usa Geist, también sin atributo `data-theme`. `atempo-claro` usa Inter. Las fuentes están en el repositorio, con licencia OFL. Ambos temas conservan el espaciado natural de las fuentes.

Los tokens de color, la tipografía y las reglas comunes de los controles se definen en `docs/storybook/src/system.css`, la fuente visual compartida que importan Storybook y el escritorio. Sus reglas globales se aplican a todas las pantallas, incluido el panel real del profesor. Los estilos locales del panel y sus portales consumen esos tokens; sus cabeceras de tabla usan `--text-xs`, su interlineado y peso 600, y heredan el espaciado entre letras. Los estilos del escritorio no añaden colores literales.

Las pantallas usan las clases de daisyUI. El calendario es de React Day Picker 9.14.0, con la clase `react-day-picker` de daisyUI y los colores del tema. Los nombres de los días de la semana conservan 12px, según la [regla del calendario](storybook/src/rules/calendario.mdx).

Las reglas de la guía siguen la [guía de Apple](https://developer.apple.com/design/human-interface-guidelines).
