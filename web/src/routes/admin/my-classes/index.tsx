import { createFileRoute } from '@tanstack/react-router'
import { CoursesScreen } from '../../../admin/CoursesScreen'

export const Route = createFileRoute('/admin/my-classes/')({
  component: MyClassesPage
})

function MyClassesPage(): React.JSX.Element {
  return <CoursesScreen mine />
}
