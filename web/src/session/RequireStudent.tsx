import { Navigate } from '@tanstack/react-router'
import { useSessionStore } from './sessionStore'

// Las pantallas del alumno solo se ven con la sesión abierta. Sin sesión, vuelve al inicio de sesión.
export function RequireStudent({ children }: { children: React.ReactNode }): React.JSX.Element {
  const email = useSessionStore((state) => state.email)
  if (email === null) return <Navigate to="/" replace />
  return <>{children}</>
}
