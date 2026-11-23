// Inicio → escanear → registrada es un mismo recorrido.
// En escritorio, el contenido de las tres pantallas empieza a la misma altura para que no salte al pasar.
// Las cabeceras miden 4rem (h-16). En el móvil el contenido va centrado.

// Para una pantalla con cabecera de 4rem.
export const flowTopBelowHeader = 'sm:justify-start sm:pt-[18vh]'

// Para una pantalla sin cabecera: suma el alto que ocuparía la cabecera.
export const flowTopWithoutHeader = 'sm:justify-start sm:pt-[calc(4rem+18vh)]'
