import { createFileRoute } from '@tanstack/react-router'
import { OrganizationListScreen } from '../../organization/OrganizationListScreen'

export const Route = createFileRoute('/organization/list')({
  component: OrganizationListScreen
})
