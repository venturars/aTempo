import { createFileRoute } from '@tanstack/react-router'
import { SessionDetails } from '../../../admin/SessionDetails'

export const Route = createFileRoute('/admin/sessions/$sessionId')({
  component: SessionPage
})

function SessionPage(): React.JSX.Element {
  const { sessionId } = Route.useParams()
  return <SessionDetails sessionId={sessionId} />
}
