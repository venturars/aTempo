import { createFileRoute } from '@tanstack/react-router'
import { SessionPage } from '../../../admin/adminPages'

export const Route = createFileRoute('/admin/sessions/$sessionId')({ component: SessionPage })
