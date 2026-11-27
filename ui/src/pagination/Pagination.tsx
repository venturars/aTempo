import { clampPage, pageItems } from './pageItems'

export type PaginationLabels = {
  navigation: string
  previous: string
  next: string
  page: (page: number) => string
}

export const defaultPaginationLabels: PaginationLabels = {
  navigation: 'Paginación',
  previous: 'Página anterior',
  next: 'Página siguiente',
  page: (page) => `Página ${page}`
}

export type PaginationSize = 'xs' | 'sm' | 'md'

const buttonSize: Record<PaginationSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: ''
}

export type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  siblings?: number
  size?: PaginationSize
  labels?: Partial<PaginationLabels>
  className?: string
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  size = 'md',
  labels,
  className
}: PaginationProps): React.JSX.Element | null {
  if (pageCount <= 1) {
    return null
  }
  const current = clampPage(page, pageCount)
  const text = { ...defaultPaginationLabels, ...labels }
  const button = ['join-item btn', buttonSize[size]].filter(Boolean).join(' ')

  return (
    <nav aria-label={text.navigation} className={className}>
      <div className="join">
        <button
          type="button"
          className={button}
          aria-label={text.previous}
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          «
        </button>
        {pageItems(current, pageCount, siblings).map((item, index) =>
          item === 'gap' ? (
            <span
              key={`gap-${index}`}
              className={`${button} pointer-events-none text-base-content/50`}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === current ? `${button} btn-primary` : button}
              aria-label={text.page(item)}
              aria-current={item === current ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          className={button}
          aria-label={text.next}
          disabled={current === pageCount}
          onClick={() => onPageChange(current + 1)}
        >
          »
        </button>
      </div>
    </nav>
  )
}
