import { createFileRoute } from '@tanstack/react-router'
import { OrganizationDashboardScreen } from '../../organization/OrganizationDashboardScreen'

export const Route = createFileRoute('/organization/dashboard')({
  component: OrganizationDashboardScreen
})
