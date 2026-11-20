import { createFileRoute } from '@tanstack/react-router'
import { CoursesScreen } from '../../../admin/CoursesScreen'

export const Route = createFileRoute('/admin/courses/')({
  component: CoursesScreen
})
