import './styles/app.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { applyTheme, readTheme } from './session/sessionStore'
import { routeTree } from './routeTree.gen'

applyTheme(readTheme())

const router = createRouter({ routeTree, caseSensitive: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
