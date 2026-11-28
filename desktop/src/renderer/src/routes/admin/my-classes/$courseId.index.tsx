import { createFileRoute } from '@tanstack/react-router'
import { MyCoursePage } from '../../../admin/adminPages'

export const Route = createFileRoute('/admin/my-classes/$courseId/')({ component: MyCoursePage })
