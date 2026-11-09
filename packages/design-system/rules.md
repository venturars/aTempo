# aTempo · reglas de UI

Valen para cualquier pantalla. Dicen cómo se ve y cómo se escribe. El producto lo decide el resto de la constitución (`README.md`).

La guía `reference/index.html` son ejemplos para mirar, no componentes para copiar. Se aplican estas clases a la feature, sin calcar un ejemplo. La guía mezcla perfiles y muestra integraciones que la constitución no tiene. La navegación y las integraciones salen de la constitución.

La app se construye con DaisyUI 5. Los colores, el radio y la fuente salen de `theme.css`. El oscuro índigo usa Geist. El claro índigo usa Inter.

## Hacer

- Un color de acción: `primary`. El verde solo significa Presente, Abierta o Aprobado.
- Los estados son `badge badge-soft` más texto. Pendiente es neutral. El color no va solo.
- Tarjetas `card bg-base-100 shadow-sm`, radio 16, sin borde. El tema fija el campo a 38 px y el botón a 36 px, 30 px en `sm`.
- Texto: 28, 20, 16, 14, 13 y 11. Peso máximo 600. Lo secundario es `text-base-content/60`.
- Números tabulares (`tabular-nums`). Filas de 56 px. Cabecera de tabla a 11 px y en mayúsculas.
- Las acciones destructivas van en gris. El rojo relleno solo aparece en la confirmación.
- Iconos rellenos a dos tonos, sólido y 35 %, a 18 px en la navegación.
- Una corrección pide un motivo. Muestra quién, cuándo y por qué.

## No hacer

- Barra lateral de color en el ítem activo. Pills en mayúsculas. Puntos de color sin texto.
- Botón primario negro. Emojis. Ilustraciones SVG dibujadas a mano.
- Más de un color saturado por pantalla, aparte de los estados.
- Colores escritos a mano. Si el color no sale del tema, no cambia cuando el usuario elige otro.
- Quitar el anillo de foco.

## Accesibilidad

La sección 15 pide que se pueda usar con teclado y con lector de pantalla. En la práctica:

- Un control es un `button`, un enlace o un campo. No es un `div` con un clic.
- Tiene un nombre visible. Un icono solo no basta.
- El foco se ve.

## Texto

La interfaz va en español. Los nombres que la constitución ya usa se quedan como están: Dashboard y Settings.

Se habla como una persona, en frases cortas. Un botón es la acción, en un verbo. Un aviso o un error dice qué pasa o qué hacer, en una línea.

No se añade texto que la pantalla no necesita. Si la etiqueta ya lo dice, no va un subtítulo, una introducción ni una ayuda debajo. Una pantalla vacía dice qué falta, en una línea, cuando con eso basta. Una frase se queda si hace falta para entender la pantalla: un aviso de predicción dice el patrón, como en la constitución.

Un campo inválido, en cualquier formulario, no muestra el aviso del navegador. El campo usa `input-error` y, debajo, la frase corta en `text-error`. El anillo lo dibuja el tema.

No suena a texto generado. Nada de «¡Por supuesto!», «Encantado de ayudarte», «Es importante destacar», «No dudes en», «potenciar tu experiencia» ni «No es solo esto, sino también aquello». Sin inglés en los mensajes y sin signos de exclamación para animar.

## Clases DaisyUI

| Pieza | Clase |
| --- | --- |
| Botón de acción | `btn btn-primary` |
| Botón secundario | `btn bg-base-200 border-0` |
| Botón ghost | `btn btn-ghost` |
| Peligro, solo al confirmar | `btn btn-error` |
| Presente | `badge badge-soft badge-success` |
| Retraso | `badge badge-soft badge-warning` |
| Ausente | `badge badge-soft badge-error` |
| Salida | `badge badge-soft badge-info` |
| Pendiente | `badge badge-soft badge-neutral` |
| Pestañas | `tabs tabs-border` |
| Filtros | `btn btn-sm rounded-full` |
| Campo | `input bg-base-200 border-0` |
| Interruptor | `toggle toggle-primary` |
| Modal | `modal` |
| Aviso | `alert alert-soft` |
| Carga | `skeleton` |

## Temas

La app abre en oscuro y deja el otro tema para Settings. Una feature no añade el selector. Al cambiar de tema, Settings pone la clase `theme-switching` en `html` y la quita al terminar. Si no, el cambio no se anima. Los valores de `data-theme` son:

- `atempo-oscuro`, oscuro índigo. Es el valor por defecto.
- `atempo-claro`, claro índigo.

El cálido y el contraste están en `themes-later.css`. No se usan.
