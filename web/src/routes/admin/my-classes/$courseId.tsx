import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/my-classes/$courseId')({ component: Outlet })
