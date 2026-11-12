import { createFileRoute } from '@tanstack/react-router'
import { LoginScreen } from '../login/LoginScreen'

export const Route = createFileRoute('/')({
  component: LoginScreen
})
