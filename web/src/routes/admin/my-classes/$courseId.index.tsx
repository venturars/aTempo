import { createFileRoute } from '@tanstack/react-router'
import { CourseDetails } from '../../../admin/CourseDetails'

export const Route = createFileRoute('/admin/my-classes/$courseId/')({ component: MyCoursePage })

function MyCoursePage(): React.JSX.Element {
  const { courseId } = Route.useParams()
  return <CourseDetails key={courseId} courseId={courseId} readOnly />
}
