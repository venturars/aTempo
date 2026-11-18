import { useEffect, useState } from 'react'

// El movimiento de Tempito se diseñó a 30 fotogramas por segundo (en Remotion) y luego se frenó al 60 %.
const framesPerSecond = 30
export const motionSpeed = 0.6

// Devuelve el fotograma actual de la animación, que avanza con el reloj de la pantalla.
// Si el sistema pide menos movimiento, se queda en el fotograma 0: Tempito sale quieto.
// Con la pestaña oculta, requestAnimationFrame se para solo.
export function useMotionFrame(): number {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let request = 0
    const start = performance.now()
    function tick(now: number): void {
      setFrame(((now - start) / 1000) * framesPerSecond * motionSpeed)
      request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [])

  return frame
}
