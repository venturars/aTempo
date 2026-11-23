import { createFileRoute } from '@tanstack/react-router'
import { PeopleScreen } from '../../admin/PeopleScreen'

export const Route = createFileRoute('/admin/people')({
  component: PeopleScreen
})
