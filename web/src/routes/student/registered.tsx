import { createFileRoute } from '@tanstack/react-router'
import { RegisteredScreen } from '../../student/registered/RegisteredScreen'

export const Route = createFileRoute('/student/registered')({
  component: RegisteredScreen
})
