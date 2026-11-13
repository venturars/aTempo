import { createRootRoute, Outlet } from '@tanstack/react-router'
import { LoginScreen } from '../login/LoginScreen'

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: LoginScreen
})
