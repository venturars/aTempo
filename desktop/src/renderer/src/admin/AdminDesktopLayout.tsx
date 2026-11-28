import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from '@tanstack/react-router'
import { useAdminStore } from '@web/admin/adminStore'
import { ThemeToggle } from '@web/shared/ThemeToggle'
import { useSessionStore } from '../session/sessionStore'
import { saveTheme } from '../theme'

const pageWidth = 'mx-auto w-full max-w-5xl px-4 sm:px-6'

function currentTheme(): string {
  return document.documentElement.getAttribute('data-theme') ?? 'atempo-oscuro'
}

// La misma cabecera que AdminLayout de la web, con la sesión de Electron en lugar de las cookies.
export function AdminDesktopLayout(): React.JSX.Element {
  const profile = useSessionStore((state) => state.profile)
  const endSession = useSessionStore((state) => state.endSession)
  const organization = useAdminStore((state) => state.organization)
  const people = useAdminStore((state) => state.people)
  const currentPersonId = useAdminStore((state) => state.currentPersonId)
  const exitDemo = useAdminStore((state) => state.exitDemo)
  const navigate = useNavigate()
  const [theme, setTheme] = useState(currentTheme)
  const currentPerson = people.find((person) => person.id === currentPersonId)

  useEffect(() => {
    if (profile === 'admin' && currentPersonId === null) {
      useAdminStore.getState().enterDemo()
    }
  }, [currentPersonId, profile])

  if (profile !== 'admin') return <Navigate to="/" replace />

  if (currentPerson === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center" role="status">
        <span className="loading loading-spinner loading-lg" aria-label="Abriendo administración" />
      </main>
    )
  }

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    document.documentElement.setAttribute('data-theme', next)
    saveTheme(next)
    setTheme(next)
  }

  function onExit(): void {
    exitDemo()
    endSession()
    void navigate({ to: '/', replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-base-200/85 backdrop-blur">
        <div className={`${pageWidth} flex min-h-16 items-center gap-4 py-3 sm:gap-8`}>
          <Link to="/admin" className="text-xl font-semibold">
            aTempo
          </Link>
          <span className="hidden text-sm text-base-content/60 sm:block">{organization.name}</span>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle dark={theme === 'atempo-oscuro'} onToggle={onTheme} />
            <button className="btn btn-ghost btn-sm" type="button" onClick={onExit}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <nav
          className={`${pageWidth} flex h-12 items-stretch gap-1 sm:gap-4`}
          aria-label="Administración"
        >
          <Link to="/admin" activeOptions={{ exact: true }} className="nav-link">
            Inicio
          </Link>
          <Link to="/admin/people" className="nav-link">
            Personas
          </Link>
          <Link to="/admin/courses" className="nav-link">
            Cursos
          </Link>
          {currentPerson.roles.includes('teacher') ? (
            <Link to="/admin/my-classes" className="nav-link">
              Mis clases
            </Link>
          ) : null}
        </nav>
      </header>
      <main className={`${pageWidth} page-enter flex min-w-0 flex-1 flex-col gap-8 py-8 sm:py-10`}>
        <Outlet />
      </main>
    </div>
  )
}
