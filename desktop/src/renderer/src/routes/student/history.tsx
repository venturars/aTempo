import { createFileRoute } from '@tanstack/react-router'
import { HistoryScreen } from '../../student/history/HistoryScreen'

export const Route = createFileRoute('/student/history')({
  component: HistoryScreen
})
