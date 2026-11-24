import './styles/app.css'

import { StrictMode, useEffect } from 'react'
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
  useEffect(() => {
    void window.api.auth
      .isConfigured()
      .then(async (isConfigured) => {
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

  // Cada pantalla con sesión tiene su «Cerrar sesión», que llama a endSession y borra el token.
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthSessionBootstrap />
  </StrictMode>
)
