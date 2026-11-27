import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { applyTheme, readTheme } from '../session/sessionStore'
import { useText } from '../lang/useText'
import { ThemeToggle } from '../shared/ThemeToggle'
import { AdminEntry } from './AdminEntry'
import { useAdminStore } from './adminStore'
import { useSessionStore } from '../session/sessionStore'

const pageWidth = 'mx-auto w-full max-w-5xl px-4 sm:px-6'

export function AdminLayout(): React.JSX.Element {
  const organization = useAdminStore((state) => state.organization)
  const people = useAdminStore((state) => state.people)
  const currentPersonId = useAdminStore((state) => state.currentPersonId)
  const exitDemo = useAdminStore((state) => state.exitDemo)
  const profile = useSessionStore((state) => state.profile)
  const endStudentSession = useSessionStore((state) => state.endStudentSession)
  const isLoggingOut = useSessionStore((state) => state.isLoggingOut)
  const t = useText()
  const logoutError = useSessionStore((state) => state.logoutError)
  const navigate = useNavigate()
  const [theme, setTheme] = useState(readTheme)
  const currentPerson = people.find((person) => person.id === currentPersonId)

  useEffect(() => {
    if (profile === 'admin' && currentPersonId === null) {
      useAdminStore.getState().enterDemo()
    }
  }, [currentPersonId, profile])

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    applyTheme(next)
    setTheme(next)
  }

  async function onExit(): Promise<void> {
    if (!(await endStudentSession())) return
    exitDemo()
    void navigate({ to: '/admin' })
  }

  if (profile === 'admin' && currentPersonId === null) {
    return (
      <main className="flex min-h-screen items-center justify-center" role="status">
        <span className="loading loading-spinner loading-lg" aria-label="Abriendo administración" />
      </main>
    )
  }

  if (
    profile !== 'admin' ||
    !currentPerson?.roles.includes('admin') ||
    currentPerson.organizationId !== organization.id ||
    currentPerson.state !== 'active'
  ) {
    return <AdminEntry dark={theme === 'atempo-oscuro'} onTheme={onTheme} />
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
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={isLoggingOut}
              onClick={() => void onExit()}
            >
              {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
        {logoutError !== '' ? (
          <p className={`${pageWidth} alert alert-soft alert-error`} role="alert">
            {t(logoutError)}
          </p>
        ) : null}
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
