import { createFileRoute } from '@tanstack/react-router'
import { ScanScreen } from '../../student/scan/ScanScreen'

// Con ?escribir=true, el campo del código sale abierto (por ejemplo, desde un QR caducado).
export const Route = createFileRoute('/student/scan')({
  validateSearch: (search: Record<string, unknown>): { escribir?: boolean } => ({
    escribir: search.escribir === true ? true : undefined
  }),
  component: ScanRoute
})

function ScanRoute(): React.JSX.Element {
  const { escribir } = Route.useSearch()
  return <ScanScreen startWithCode={escribir === true} />
}
