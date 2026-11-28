import { createFileRoute } from '@tanstack/react-router'
import { MyClassesPage } from '../../../admin/adminPages'

export const Route = createFileRoute('/admin/my-classes/')({ component: MyClassesPage })
