import { useState } from 'react'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { applyTheme, readTheme } from '../session/sessionStore'
import { ThemeToggle } from '../shared/ThemeToggle'
import { useAdminStore } from './adminStore'

const pageWidth = 'mx-auto w-full max-w-5xl px-4 sm:px-6'

export function AdminLayout(): React.JSX.Element {
  const organization = useAdminStore((state) => state.organization)
  const people = useAdminStore((state) => state.people)
  const currentPersonId = useAdminStore((state) => state.currentPersonId)
  const enterDemo = useAdminStore((state) => state.enterDemo)
  const exitDemo = useAdminStore((state) => state.exitDemo)
  const navigate = useNavigate()
  const [theme, setTheme] = useState(readTheme)
  const currentPerson = people.find((person) => person.id === currentPersonId)

  function onTheme(): void {
    const next = theme === 'atempo-claro' ? 'atempo-oscuro' : 'atempo-claro'
    applyTheme(next)
    setTheme(next)
  }

  function onExit(): void {
    exitDemo()
    void navigate({ to: '/admin' })
  }

  if (
    !currentPerson?.roles.includes('admin') ||
    currentPerson.organizationId !== organization.id ||
    currentPerson.state !== 'active'
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <section className="page-enter panel-card flex w-full max-w-md flex-col gap-7 rounded-box p-6 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-semibold">aTempo</p>
            <ThemeToggle dark={theme === 'atempo-oscuro'} onToggle={onTheme} />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold">Tu organización, preparada para clase</h1>
            <p className="text-base-content/65">
              Invita a tu equipo, organiza los cursos y programa las próximas sesiones.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={enterDemo}>
            Abrir demo de administración
          </button>
          <p className="text-sm text-base-content/60">
            Datos de ejemplo. Los cambios se restablecen al recargar y las invitaciones no envían
            correos.
          </p>
          <Link className="link w-fit text-sm" to="/">
            Volver al acceso del alumno
          </Link>
        </section>
      </main>
    )
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
