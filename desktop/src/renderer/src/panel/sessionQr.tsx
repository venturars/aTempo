import { useEffect, useMemo, useRef, useState } from 'react'

function qrModules(size: number, seed: number): boolean[][] {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  stampFinder(grid, 0, 0)
  stampFinder(grid, size - 7, 0)
  stampFinder(grid, 0, size - 7)
  let bit = seed % 97
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (inFinder(x, y, size)) {
        continue
      }
      bit = (bit * 33 + x * 7 + y) % 97
      grid[y][x] = bit % 3 !== 0
    }
  }
  return grid
}

function stampFinder(grid: boolean[][], originX: number, originY: number): void {
  for (let y = 0; y < 7; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
      grid[originY + y][originX + x] = edge || core
    }
  }
}

function inFinder(x: number, y: number, size: number): boolean {
  const corner = (originX: number, originY: number): boolean =>
    x >= originX && x < originX + 7 && y >= originY && y < originY + 7
  return corner(0, 0) || corner(size - 7, 0) || corner(0, size - 7)
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
  const size = 21
  const cells = useMemo(() => (code === null ? [] : qrModules(size, Number(code))), [code])
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <p className="text-sm font-medium">QR de ejemplo</p>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-36 rounded-box bg-base-200 p-2.5"
        role="img"
        aria-label="QR de ejemplo"
      >
        {cells.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="1"
                height="1"
                className="fill-base-content"
              />
            ) : null
          )
        )}
      </svg>
      {code === null ? (
        <p className="text-sm">Pidiendo el código…</p>
      ) : (
        <>
          <p className="text-sm font-medium tabular-nums">Código {code}</p>
          <p className="text-sm">
            Cambia en {seconds} {seconds === 1 ? 'segundo' : 'segundos'}
          </p>
        </>
      )}
    </div>
  )
}
