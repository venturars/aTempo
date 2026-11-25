import './styles/app.css'

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createHashHistory,
  createRouter,
  RouterProvider,
  useRouterState
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { teacherDemoAccount } from './login/teacherDemoAccount'
import { useSessionStore } from './session/sessionStore'
import { applySavedTheme } from './theme'

applySavedTheme()

const router = createRouter({ routeTree, history: createHashHistory(), caseSensitive: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Pantallas con su propio «Cerrar sesión».
const ownLogout = ['/teacher/panel', '/student/dashboard']

export function AuthSessionBootstrap(): React.JSX.Element {
  const [authConfigured, setAuthConfigured] = useState(false)
  const profile = useSessionStore((state) => state.profile)
  const pathname = useRouterState({ router, select: (state) => state.location.pathname })

  useEffect(() => {
    void window.api.auth
      .isConfigured()
      .then(async (isConfigured) => {
        setAuthConfigured(isConfigured)
        if (!isConfigured) return
        const user = await window.api.auth.me()
        // A pending restore must not clear a session created by a newer login.
        if (useSessionStore.getState().profile !== null) return
        if (user === null) {
          useSessionStore.getState().clearSession()
          await router.navigate({ to: '/' })
          return
        }
        const normalizedEmail = user.email.trim().toLowerCase()
        const profile =
          normalizedEmail === 'profesor@atempo.test'
            ? 'teacher'
            : normalizedEmail === 'ada.lopez@clase.test'
              ? 'student'
              : null
        if (profile === null) {
          await router.navigate({ to: '/' })
          return
        }
        if (profile === 'teacher') {
          useSessionStore.getState().startTeacherSession(normalizedEmail, teacherDemoAccount.name)
        } else {
          useSessionStore.getState().startSession(profile, normalizedEmail)
        }
        if (router.state.location.pathname === '/') {
          await router.navigate({
            to: profile === 'teacher' ? '/teacher/panel' : '/student/dashboard'
          })
        }
      })
      .catch(() => {
        if (useSessionStore.getState().profile === null) {
          useSessionStore.getState().clearSession()
          void router.navigate({ to: '/' })
        }
      })
  }, [])

  function logOut(): void {
    useSessionStore.getState().endSession()
    void router.navigate({ to: '/', replace: true })
  }

  return (
    <>
      <RouterProvider router={router} />
      {authConfigured && profile !== null && !ownLogout.includes(pathname) ? (
        <button className="btn btn-ghost fixed right-4 top-4 z-50" type="button" onClick={logOut}>
          Cerrar sesión
        </button>
      ) : null}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthSessionBootstrap />
  </StrictMode>
)
