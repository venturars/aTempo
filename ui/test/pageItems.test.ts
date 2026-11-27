import { describe, expect, it } from 'vitest'
import { clampPage, pageItems } from '../src'

describe('pageItems', () => {
  it('lists every page when they all fit', () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('returns nothing without pages', () => {
    expect(pageItems(1, 0)).toEqual([])
  })

  it('shows the first, the last, the current page and its siblings with gaps', () => {
    expect(pageItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10])
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10])
    expect(pageItems(7, 10)).toEqual([1, 'gap', 6, 7, 8, 9, 10])
    expect(pageItems(10, 10)).toEqual([1, 'gap', 6, 7, 8, 9, 10])
  })

  it('keeps the same number of items on every page', () => {
    const lengths = new Set(
      Array.from({ length: 30 }, (_, index) => pageItems(index + 1, 30).length)
    )
    expect(lengths).toEqual(new Set([7]))
    expect(pageItems(15, 30, 2)).toEqual([1, 'gap', 13, 14, 15, 16, 17, 'gap', 30])
  })

  it('treats a page out of range as the closest one', () => {
    expect(pageItems(0, 10)).toEqual(pageItems(1, 10))
    expect(pageItems(99, 10)).toEqual(pageItems(10, 10))
    expect(clampPage(0, 5)).toBe(1)
    expect(clampPage(8, 5)).toBe(5)
    expect(clampPage(3, 0)).toBe(1)
  })
})
