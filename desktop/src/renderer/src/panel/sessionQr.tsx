function qrModules(size: number): boolean[][] {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  stampFinder(grid, 0, 0)
  stampFinder(grid, size - 7, 0)
  stampFinder(grid, 0, size - 7)
  let bit = 1
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

export function SessionQr(): React.JSX.Element {
  const size = 21
  const cells = qrModules(size)
  return (
    <div className="shrink-0 rounded-box bg-base-200 p-2.5">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-36"
        role="img"
        aria-label="Código de la lista"
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
    </div>
  )
}
