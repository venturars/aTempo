import confetti from 'canvas-confetti'

// Confeti al registrar la entrada: los «cañones laterales» de Magic UI
// (magicui.design/docs/components/confetti), hechos con canvas-confetti, que es lo que usa Magic UI por dentro.
// Los colores salen del tema. Sin movimiento si el sistema lo pide.

const celebrationMs = 2000

const themeColorNames = [
  '--color-primary',
  '--color-secondary',
  '--color-success',
  '--color-warning',
  '--color-info'
]

// canvas-confetti necesita colores hex. El tema los define así.
function readThemeColors(): string[] {
  const style = getComputedStyle(document.documentElement)
  return themeColorNames
    .map((name) => style.getPropertyValue(name).trim())
    .filter((color) => color.startsWith('#'))
}

// Dispara confeti desde los dos lados durante un par de segundos.
// Devuelve una función que lo para y lo borra, para usarla al salir de la pantalla.
export function fireSideCannons(): () => void {
  const colors = readThemeColors()
  const end = Date.now() + celebrationMs
  let frame = 0

  function shootFromBothSides(): void {
    if (Date.now() > end) return
    const shared = { particleCount: 2, spread: 55, startVelocity: 60, colors, disableForReducedMotion: true }
    void confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.5 } })
    void confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.5 } })
    frame = requestAnimationFrame(shootFromBothSides)
  }

  shootFromBothSides()

  return () => {
    cancelAnimationFrame(frame)
    confetti.reset()
  }
}
