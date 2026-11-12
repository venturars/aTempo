import { createFileRoute } from '@tanstack/react-router'
import { RegisterScreen } from '../register/RegisterScreen'

export const Route = createFileRoute('/sign-up')({
  component: RegisterScreen
})
