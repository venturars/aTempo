import { createFileRoute } from '@tanstack/react-router'
import { AdminHome } from '../../admin/AdminHome'

export const Route = createFileRoute('/admin/')({ component: AdminHome })
