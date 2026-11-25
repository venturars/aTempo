import { useEffect } from 'react'
import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { readWebSession } from '../auth/webSession'
import { useText } from '../language/useText'
import { LoginScreen } from '../login/LoginScreen'
import { useSessionStore } from '../session/sessionStore'
import { hasPendingCheckIn } from '../student/checkIn/pendingCheckIn'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: LoginScreen
})

// Restaura la cookie antes de montar pantallas privadas y mantiene cada perfil en su área.
function RootLayout(): React.JSX.Element {
  const t = useText()
  const isReady = useSessionStore((state) => state.isReady)
  const profile = useSessionStore((state) => state.profile)
  const setSession = useSessionStore((state) => state.setSession)
  const setLoading = useSessionStore((state) => state.setLoading)
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  })
  const navigate = useNavigate()

  useEffect(() => {
    void readWebSession()
      .then((session) => {
        if (session) setSession(session.email, session.profile)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [setLoading, setSession])

  useEffect(() => {
    if (!isReady || profile === null) return
    if (profile === 'admin' && (pathname === '/' || pathname.startsWith('/student/'))) {
      void navigate({ to: '/admin', replace: true })
    } else if (profile === 'student' && pathname.startsWith('/admin')) {
      void navigate({ to: '/student/dashboard', replace: true })
    } else if (profile === 'student' && pathname === '/' && !hasPendingCheckIn()) {
      void navigate({ to: '/student/dashboard', replace: true })
    }
  }, [isReady, navigate, pathname, profile])

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center" role="status">
        <span
          className="loading loading-spinner loading-lg"
          aria-label={t('app.checkingSession')}
        />
      </main>
    )
  }

  return <Outlet />
}
