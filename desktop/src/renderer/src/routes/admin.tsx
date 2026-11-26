import { createFileRoute } from '@tanstack/react-router'
import { AdminDesktopLayout } from '../admin/AdminDesktopLayout'

export const Route = createFileRoute('/admin')({ component: AdminDesktopLayout })
