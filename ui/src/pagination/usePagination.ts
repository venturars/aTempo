import { useState } from 'react'
import { clampPage } from './pageItems'

export type PaginationState<T> = {
  page: number
  pageCount: number
  items: T[]
  from: number
  to: number
  total: number
  setPage: (page: number) => void
}

export function usePagination<T>(items: readonly T[], pageSize: number): PaginationState<T> {
  const [requestedPage, setRequestedPage] = useState(1)
  const size = Math.max(1, Math.trunc(pageSize))
  const total = items.length
  const pageCount = Math.ceil(total / size)
  const page = clampPage(requestedPage, pageCount)
  const start = (page - 1) * size
  const visible = items.slice(start, start + size)
  return {
    page,
    pageCount,
    items: visible,
    from: total === 0 ? 0 : start + 1,
    to: start + visible.length,
    total,
    setPage: (next) => setRequestedPage(clampPage(next, pageCount))
  }
}
