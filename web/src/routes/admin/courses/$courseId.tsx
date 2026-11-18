import { createFileRoute } from '@tanstack/react-router'
import { CourseDetails } from '../../../admin/CourseDetails'

export const Route = createFileRoute('/admin/courses/$courseId')({
  component: CoursePage
})

function CoursePage(): React.JSX.Element {
  const { courseId } = Route.useParams()
  return <CourseDetails key={courseId} courseId={courseId} />
}
