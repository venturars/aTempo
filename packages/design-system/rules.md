# aTempo · reglas de UI

Valen para cualquier pantalla. Dicen cómo se ve y cómo se escribe. El producto lo decide el resto de la constitución (`README.md`).

`reference/guia.html` es el ejemplo para leer y copiar patrones. `reference/index.html` es la misma guía para mirar. La navegación y las integraciones salen de la constitución.

La app se construye con DaisyUI 5. Los colores, el radio y la fuente salen de `theme.css`. El oscuro índigo usa Geist. El claro índigo usa Inter.

## Hacer

- La página es `bg-base-200`. El contenido va en tarjetas `card bg-base-100 shadow-sm`, radio 16, sin borde. El campo y el botón secundario van sobre la tarjeta: si no, no se ven.
- Un color de acción: `primary`. El verde es un estado favorable, con su palabra. No sustituye a la acción.
- Los estados de asistencia son `badge badge-soft` más texto: Presente, Retraso, Ausente, Salida, Pendiente y Justificada. Justificada no es Ausente. Otro estado usa el badge de sentido más cercano, con su palabra. El color no va solo.
- El tema fija el campo y el select a 38 px, el botón a 36 px y el `sm` a 30 px. En una pantalla táctil los sube a 44 px. Por debajo de 768 px la navegación cabe en la pantalla: barra inferior o cajón, no una columna fija.
- El tema fija el texto: `text-2xl` 28, `text-xl` 20, `text-base` 16, `text-sm` 14, `text-meta` 13 y `text-xs` 11. No hay otro tamaño. Peso máximo 600. Lo secundario es `text-base-content/60`.
- El espacio es 8, 12, 16 o 24 px: `gap-2`, `gap-3`, `gap-4` o `gap-6`.
- Números tabulares (`tabular-nums`). El tema fija la fila a 56 px y la cabecera en mayúsculas.
- La hora es 24 h, `09:00`. La fecha es `09/11/2026`. Un porcentaje es `85 %`.
- Las acciones destructivas van en gris. El rojo relleno solo aparece al confirmar, y la frase dice qué va a pasar.
- El ítem de navegación activo y el filtro elegido son `bg-primary/10 text-primary`, sin barra de color.
- Los iconos son Heroicons. Solid en la navegación, outline en las acciones, a 20 px. Quitar un chip usa el outline a 16 px.
- Una estadística usa `primary`. Si hay otra serie, es el mismo color más claro, no un color nuevo. Un juego tampoco trae su paleta. `secondary` queda para Justificada y `accent` no se usa.

## No hacer

- Barra de color en el ítem activo. Pills en mayúsculas. Puntos de color sin texto.
- Botón primario negro. Emojis. Dibujos de adorno. La mascota que pide la constitución puede tener el suyo.
- Usar `accent`, o un color fuera de `primary` y los estados.
- Colores escritos a mano. Si el color no sale del tema, no cambia cuando el usuario elige otro.
- Quitar el anillo de foco.

## Uso

- En cada zona hay una acción primaria, junto a lo que cambia.
- La misma acción usa la misma clase y el mismo verbo en todas las pantallas.
- Las opciones de una elección están en la pantalla.
- Si un dato tarda, se ve. Un bloque sin datos usa `skeleton`. Al llegar, se muestra el dato.
- Un diálogo se cierra con un verbo.

## Accesibilidad

La sección 15 pide que se pueda usar con teclado y con lector de pantalla. En la práctica:

- Un control es un `button`, un enlace o un campo. No es un `div` con un clic.
- El nombre se ve. Un icono solo no basta, y el placeholder no es el nombre.
- El foco se ve y sigue el orden de lectura.
- Si no se puede seguir, una línea dice por qué.

## Texto

La interfaz va en español. Los nombres que la constitución ya usa se quedan como están: Dashboard y Settings.

Se habla de tú, en frases cortas. Un botón es la acción, en un verbo. Un aviso o un error dice qué pasa y cómo seguir, en una línea.

No se añade texto que la pantalla no necesita. Si la etiqueta ya lo dice, no va un subtítulo, una introducción ni una ayuda debajo. Una pantalla vacía dice qué falta, en una línea, cuando con eso basta. Una frase se queda si hace falta para entender la pantalla: un aviso de predicción dice el patrón, como en la constitución.

Un campo inválido, en cualquier formulario, no muestra el aviso del navegador. El campo usa `input-error`, `aria-invalid="true"` y `aria-describedby` apuntando a la frase corta en `text-error`. El anillo lo dibuja el tema.

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
| Justificada | `badge badge-soft badge-secondary` |
| Ítem activo | `bg-primary/10 text-primary` |
| Pestañas | `tabs tabs-border` |
| Filtro | `btn btn-sm rounded-full bg-base-200 border-0` |
| Filtro elegido | `btn btn-sm rounded-full bg-primary/10 text-primary border-0` |
| Campo | `input bg-base-200 border-0` |
| Select | `select bg-base-200 border-0` |
| Casilla | `checkbox` |
| Radio | `radio` |
| Tabla | `table` |
| Interruptor | `toggle toggle-primary` |
| Modal | `modal` |
| Aviso | `alert alert-soft` |
| Aviso flotante | `toast toast-top toast-end` con `alert alert-soft` |
| Vacío | una línea `text-base-content/60` dentro de la tarjeta |
| Carga | `skeleton` |

## Temas

La app abre en oscuro y no sigue el tema del sistema. El otro tema queda para Settings. Una feature no añade el selector. Al cambiar de tema, Settings pone la clase `theme-switching` en `html` y la quita al terminar. Si no, el cambio no se anima. Los valores de `data-theme` son:

- `atempo-oscuro`, oscuro índigo. Es el valor por defecto.
- `atempo-claro`, claro índigo.
