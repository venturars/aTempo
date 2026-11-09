# aTempo · sistema visual

La app se construye con DaisyUI, que es lo que pide la asignatura. Esta carpeta guarda la guía para mirar, los temas y las reglas para construir.

## Qué hay aquí

- `reference/index.html` es la guía de ejemplos. Cómo usarla está en `rules.md`.
- `reference/assets/` son los logos del oscuro y del claro. La guía los busca al lado.
- `theme.css` son los dos temas de DaisyUI: oscuro índigo y claro índigo.
- `rules.md` dice cómo se ve y cómo se escribe cualquier pantalla.

## Cómo se usa en la app

El mismo aspecto vale para las tres superficies de la constitución: la administración web, la aplicación de escritorio del profesor y el portal web del alumno. No elige la tecnología de cada una. El CSS de entrada importa este archivo una sola vez:

```css
@import "@atempo/design-system/theme.css";
```

Cada pantalla nueva no vuelve a importarlo. El documento abre en oscuro:

```html
<html data-theme="atempo-oscuro">
```

Los otros valores están en `rules.md`. Tailwind y DaisyUI son las dependencias que este archivo necesita. El tema ya fija el botón a 36 px (30 px en `sm`) y el campo a 38 px. Con Vite, las fuentes salen en el build. El CLI de Tailwind deja la ruta `./fonts` y no las copia.
