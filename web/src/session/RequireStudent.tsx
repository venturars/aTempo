import { Navigate } from '@tanstack/react-router'
import { useStudentAccountsStore } from '../student/studentAccounts'
import { useSessionStore } from './sessionStore'

// Las pantallas del alumno solo se ven con la sesión abierta. Sin sesión, vuelve al inicio de sesión.
export function RequireStudent({ children }: { children: React.ReactNode }): React.JSX.Element {
  const email = useSessionStore((state) => state.email)
  const profile = useSessionStore((state) => state.profile)
  const studentExists = useStudentAccountsStore(
    (state) => profile === 'student' && email !== null && state.findByEmail(email) !== undefined
  )
  if (profile === 'admin') return <Navigate to="/admin" replace />
  if (!studentExists) return <Navigate to="/" replace />
  return <>{children}</>
}
