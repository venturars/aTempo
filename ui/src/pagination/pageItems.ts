export type PageItem = number | 'gap'

export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(Math.trunc(page), 1), Math.max(pageCount, 1))
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

export function pageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  if (pageCount <= 0) {
    return []
  }
  const around = Math.max(0, Math.trunc(siblings))
  const visible = around * 2 + 5
  if (pageCount <= visible) {
    return range(1, pageCount)
  }
  const current = clampPage(page, pageCount)
  const left = Math.max(current - around, 1)
  const right = Math.min(current + around, pageCount)
  const leftGap = left > 3
  const rightGap = right < pageCount - 2
  const edge = visible - 2
  if (!leftGap) {
    return [...range(1, edge), 'gap', pageCount]
  }
  if (!rightGap) {
    return [1, 'gap', ...range(pageCount - edge + 1, pageCount)]
  }
  return [1, 'gap', ...range(left, right), 'gap', pageCount]
}
