# Guía visual

Tailwind y daisyUI, con los temas `atempo-oscuro` y `atempo-claro`.

Storybook es la fuente de verdad. El markdown de `docs/guia/` sale de aquí y no se versiona.

## Abrir

Desde esta carpeta:

```sh
pnpm storybook
```

Abre en `atempo-oscuro`. La barra cambia a `atempo-claro`.

## Markdown

Cada cambio en esta carpeta obliga a regenerar el markdown:

```sh
pnpm guide
```

`pnpm guide:check` comprueba que `docs/guia/` sigue igual que Storybook. No se edita esa carpeta a mano.
