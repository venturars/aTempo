import { createFileRoute } from '@tanstack/react-router'
import { NoticeScreen } from '../../student/notice/NoticeScreen'

export const Route = createFileRoute('/student/notice')({
  component: NoticeScreen
})
