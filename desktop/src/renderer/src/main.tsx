import './styles/app.css'

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
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

export function AuthSessionBootstrap(): React.JSX.Element {
  const profile = useSessionStore((state) => state.profile)
  const [authConfigured, setAuthConfigured] = useState(false)

  useEffect(() => {
    void window.api.auth
      .isConfigured()
      .then(async (isConfigured) => {
        if (!isConfigured) return
        setAuthConfigured(true)
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

  async function logout(): Promise<void> {
    try {
      await window.api.auth.logout()
    } catch {
      // Clear the local UI session even if IPC cleanup fails.
    }
    useSessionStore.getState().clearSession()
    await router.navigate({ to: '/' })
  }

  return (
    <>
      <RouterProvider router={router} />
      {authConfigured && profile !== null ? (
        <button
          className="btn btn-ghost fixed right-4 top-4 z-50"
          type="button"
          onClick={() => void logout()}
        >
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
