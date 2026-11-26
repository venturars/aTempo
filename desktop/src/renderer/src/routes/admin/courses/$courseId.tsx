import { createFileRoute } from '@tanstack/react-router'
import { CoursePage } from '../../../admin/adminPages'

export const Route = createFileRoute('/admin/courses/$courseId')({ component: CoursePage })
