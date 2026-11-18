import { useEffect, useMemo, useState } from 'react'
import { encode } from 'uqr'
import { backupCode, codePeriod, qrText, secondsLeft } from './classCode'

// Un trazo por módulo oscuro. Así el SVG pesa poco aunque el QR sea grande.
function modulesPath(data: boolean[][]): string {
  return data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('')
}

export function SessionQr(): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const refresh = (): void => setNow(Date.now())
    const interval = window.setInterval(refresh, 1000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const period = codePeriod(now)
  const seconds = secondsLeft(now)
  const code = backupCode(period)
  const qr = useMemo(() => encode(qrText(period), { ecc: 'M', border: 2 }), [period])

  return (
    <div className="flex w-72 max-w-full flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        className="class-qr aspect-square w-full rounded-box"
        shapeRendering="crispEdges"
        role="img"
        aria-label="QR de la clase"
      >
        <path d={modulesPath(qr.data)} fill="currentColor" />
      </svg>
      <p className="pl-[0.3em] text-3xl font-semibold tracking-[0.3em] tabular-nums">{code}</p>
      <p className="text-sm text-base-content/60">
        Cambia en {seconds} {seconds === 1 ? 'segundo' : 'segundos'}
      </p>
    </div>
  )
}
