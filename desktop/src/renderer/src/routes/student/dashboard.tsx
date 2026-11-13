import { createFileRoute } from '@tanstack/react-router'
import { DashboardScreen } from '../../student/dashboard/DashboardScreen'

export const Route = createFileRoute('/student/dashboard')({
  component: DashboardScreen
})
