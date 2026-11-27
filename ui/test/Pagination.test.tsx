import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Pagination } from '../src'

afterEach(cleanup)

describe('Pagination', () => {
  it('shows the pages around the current one and marks it', () => {
    render(<Pagination page={5} pageCount={10} onPageChange={() => undefined} />)
    const nav = screen.getByRole('navigation', { name: 'Paginación' })
    expect(nav.textContent).toBe('«1…456…10»')
    const current = screen.getByRole('button', { name: 'Página 5' })
    expect(current.getAttribute('aria-current')).toBe('page')
    expect(current.className).toContain('btn-primary')
    expect(screen.getByRole('button', { name: 'Página 4' }).getAttribute('aria-current')).toBeNull()
  })

  it('asks for the next, the previous or a chosen page', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />)
    const previous = screen.getByRole('button', { name: 'Página anterior' }) as HTMLButtonElement
    expect(previous.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(onPageChange.mock.calls).toEqual([[2], [3]])
  })

  it('disables the next button on the last page', () => {
    render(<Pagination page={3} pageCount={3} onPageChange={() => undefined} />)
    const next = screen.getByRole('button', { name: 'Página siguiente' }) as HTMLButtonElement
    expect(next.disabled).toBe(true)
  })

  it('renders nothing with one page or none', () => {
    const { container, rerender } = render(
      <Pagination page={1} pageCount={1} onPageChange={() => undefined} />
    )
    expect(container.innerHTML).toBe('')
    rerender(<Pagination page={1} pageCount={0} onPageChange={() => undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('takes its texts and size from props', () => {
    render(
      <Pagination
        page={2}
        pageCount={3}
        size="sm"
        onPageChange={() => undefined}
        labels={{
          navigation: 'Sessions pages',
          previous: 'Previous page',
          next: 'Next page',
          page: (page) => `Page ${page}`
        }}
      />
    )
    expect(screen.getByRole('navigation', { name: 'Sessions pages' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Page 2' }).className).toContain('btn-sm')
  })

  it('treats a page out of range as the closest one', () => {
    render(<Pagination page={9} pageCount={3} onPageChange={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Página 3' }).getAttribute('aria-current')).toBe(
      'page'
    )
  })
})
