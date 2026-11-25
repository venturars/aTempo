import { createFileRoute } from '@tanstack/react-router'
import { HistoryScreen, type HistoryFixture } from '../../student/history/HistoryScreen'

export const Route = createFileRoute('/student/history')({
  validateSearch: (search: Record<string, unknown>): { fixture?: HistoryFixture } => {
    if (!import.meta.env.DEV) return {}
    const { fixture } = search
    return fixture === 'carga' || fixture === 'vacio' || fixture === 'error' ? { fixture } : {}
  },
  component: HistoryRoute
})

function HistoryRoute(): React.JSX.Element {
  const { fixture } = Route.useSearch()
  return <HistoryScreen fixture={import.meta.env.DEV ? fixture : undefined} />
}
