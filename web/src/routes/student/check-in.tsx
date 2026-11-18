import { createFileRoute } from '@tanstack/react-router'
import { CheckInScreen } from '../../student/checkIn/CheckInScreen'

// El QR de clase abre esta dirección: /student/check-in?code=ATEMPO-CLASE-1109-1234
export const Route = createFileRoute('/student/check-in')({
  validateSearch: (search: Record<string, unknown>): { code: string } => ({
    code:
      typeof search.code === 'string' || typeof search.code === 'number' ? String(search.code) : ''
  }),
  component: CheckInRoute
})

function CheckInRoute(): React.JSX.Element | null {
  const { code } = Route.useSearch()
  return <CheckInScreen code={code} />
}
