import { useParams } from '@tanstack/react-router'
import { CourseDetails } from '@web/admin/CourseDetails'
import { CoursesScreen } from '@web/admin/CoursesScreen'
import { SessionDetails } from '@web/admin/SessionDetails'

// Las mismas páginas que las rutas de web/src/routes/admin.
export function CoursePage(): React.JSX.Element {
  const { courseId } = useParams({ from: '/admin/courses/$courseId' })
  return <CourseDetails key={courseId} courseId={courseId} />
}

export function SessionPage(): React.JSX.Element {
  const { sessionId } = useParams({ from: '/admin/sessions/$sessionId' })
  return <SessionDetails sessionId={sessionId} />
}

export function MyClassesPage(): React.JSX.Element {
  return <CoursesScreen mine />
}

export function MyCoursePage(): React.JSX.Element {
  const { courseId } = useParams({ from: '/admin/my-classes/$courseId/' })
  return <CourseDetails key={courseId} courseId={courseId} readOnly />
}

export function MySessionPage(): React.JSX.Element {
  const { courseId, sessionId } = useParams({ from: '/admin/my-classes/$courseId/$sessionId' })
  return <SessionDetails sessionId={sessionId} courseId={courseId} readOnly />
}
