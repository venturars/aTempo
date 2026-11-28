import { createFileRoute } from '@tanstack/react-router'
import { MySessionPage } from '../../../admin/adminPages'

export const Route = createFileRoute('/admin/my-classes/$courseId/$sessionId')({
  component: MySessionPage
})
