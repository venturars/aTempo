# Estilo de aTempo de escritorio

## Paleta

Cada color tiene un papel fijo.

| Color     | Papel                                                                       |
| --------- | --------------------------------------------------------------------------- |
| `#ACC9E1` | Fondo de la ventana                                                         |
| `#FFFFFF` | Tarjeta del formulario                                                      |
| `#1C1917` | Texto principal, sobre la tarjeta blanca                                    |
| `#359170` | Botón Entrar y texto del botón en blanco                                    |
| `#87AF99` | Borde de los campos                                                         |
| `#3116F2` | Foco del campo                                                              |
| `#417849` | Texto secundario y alert de datos válidos, con el texto del alert en blanco |

`#87AF99` queda en el borde. El texto secundario usa `#417849`, el verde más oscuro de la misma paleta, porque `#87AF99` sobre blanco no se lee.

El tema se declara en CSS con el plugin oficial de daisyUI, `@plugin "daisyui/theme"`, con el nombre `atempo`. No hay otra configuración de colores.

## Tipografía y espacio

- La letra es la del sistema: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- El título es el único texto grande. El resto mantiene una sola jerarquía.
- La tarjeta tiene aire alrededor de los campos. Los campos no se pegan entre sí.
- Cada campo lleva su etiqueta visible. El placeholder no sustituye a la etiqueta.

# Reglas de interfaces

Siguen la [guía de interfaces de Apple](https://developer.apple.com/documentation/technologyoverviews/interface-fundamentals):
