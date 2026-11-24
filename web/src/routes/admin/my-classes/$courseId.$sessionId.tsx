import { createFileRoute } from '@tanstack/react-router'
import { SessionDetails } from '../../../admin/SessionDetails'

export const Route = createFileRoute('/admin/my-classes/$courseId/$sessionId')({
  component: MySessionPage
})

function MySessionPage(): React.JSX.Element {
  const { courseId, sessionId } = Route.useParams()
  return <SessionDetails sessionId={sessionId} courseId={courseId} readOnly />
}
