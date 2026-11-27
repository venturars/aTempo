import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePagination } from '../src'

afterEach(cleanup)

const numbers = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1)

describe('usePagination', () => {
  it('slices the items of the current page', () => {
    const { result } = renderHook(() => usePagination(numbers(45), 20))
    expect(result.current).toMatchObject({ page: 1, pageCount: 3, from: 1, to: 20, total: 45 })
    expect(result.current.items).toEqual(numbers(20))

    act(() => result.current.setPage(3))
    expect(result.current).toMatchObject({ page: 3, from: 41, to: 45 })
    expect(result.current.items).toEqual([41, 42, 43, 44, 45])
  })

  it('drops to the last page that exists when the list gets shorter', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 20), {
      initialProps: { items: numbers(45) }
    })
    act(() => result.current.setPage(3))
    rerender({ items: numbers(30) })
    expect(result.current).toMatchObject({ page: 2, pageCount: 2, from: 21, to: 30 })
  })

  it('keeps a requested page inside the range', () => {
    const { result } = renderHook(() => usePagination(numbers(45), 20))
    act(() => result.current.setPage(9))
    expect(result.current.page).toBe(3)
    act(() => result.current.setPage(-1))
    expect(result.current.page).toBe(1)
  })

  it('handles an empty list', () => {
    const { result } = renderHook(() => usePagination([], 20))
    expect(result.current).toMatchObject({ page: 1, pageCount: 0, from: 0, to: 0, total: 0 })
    expect(result.current.items).toEqual([])
  })
})
