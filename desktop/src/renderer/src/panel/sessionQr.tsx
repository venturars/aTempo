import { useEffect, useMemo, useRef, useState } from 'react'
import { encode } from 'uqr'
import { checkInUrlFor } from './classCode'
import { studentSiteUrl } from './studentSite'

// Un trazo por módulo oscuro. Así el SVG pesa poco aunque el QR sea grande.
function modulesPath(data: boolean[][]): string {
  return data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ''))).join('')
}

const renewRetryDelay = 5000

export function SessionQr({
  code,
  expiresAt,
  onExpire
}: {
  code: string | null
  expiresAt: string | null
  onExpire: () => Promise<boolean>
}): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  const renewing = useRef(false)
  const lastRenewal = useRef(0)
  const expiry = expiresAt === null ? 0 : Date.parse(expiresAt)

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
  }, [expiresAt])

  const expired = code === null || now >= expiry
  useEffect(() => {
    if (!expired || renewing.current || now - lastRenewal.current < renewRetryDelay) {
      return
    }
    renewing.current = true
    lastRenewal.current = now
    void onExpire().then((requested) => {
      renewing.current = false
      if (!requested) {
        lastRenewal.current = 0
      }
    })
  }, [expired, now, onExpire])

  const seconds = Math.min(30, Math.max(1, Math.ceil((expiry - now) / 1000)))
  const qr = useMemo(
    () =>
      code === null ? null : encode(checkInUrlFor(studentSiteUrl, code), { ecc: 'M', border: 2 }),
    [code]
  )

  return (
    <div className="flex w-72 max-w-full flex-col items-center gap-3">
      {qr === null ? (
        <div className="aspect-square w-full rounded-box bg-base-200" />
      ) : (
        <svg
          viewBox={`0 0 ${qr.size} ${qr.size}`}
          className="class-qr aspect-square w-full rounded-box"
          shapeRendering="crispEdges"
          role="img"
          aria-label="QR de la clase"
        >
          <path d={modulesPath(qr.data)} fill="currentColor" />
        </svg>
      )}
      {code === null ? (
        <p className="text-sm">Pidiendo el código…</p>
      ) : (
        <>
          <p className="pl-[0.3em] text-3xl font-semibold tracking-[0.3em] tabular-nums">{code}</p>
          <p className="text-sm text-base-content/60">
            Cambia en {seconds} {seconds === 1 ? 'segundo' : 'segundos'}
          </p>
        </>
      )}
    </div>
  )
}
