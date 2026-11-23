import type { Person } from './adminStore'

export function personRole(person: Person): string {
  if (person.roles.includes('admin') && person.roles.includes('teacher'))
    return 'Administrador y profesor'
  if (person.roles.includes('admin')) return 'Administrador'
  return person.roles.includes('teacher') ? 'Profesor' : 'Alumno'
}

export function PersonState({ person }: { person: Person }): React.JSX.Element {
  return (
    <span className="text-sm text-base-content/60">
      {person.state === 'invited' ? 'Invitación pendiente' : 'Activo'}
    </span>
  )
}

export function FormError({ message }: { message: string }): React.JSX.Element | null {
  return message ? (
    <p className="text-sm text-error" role="alert">
      {message}
    </p>
  ) : null
}

export function PageHeading({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-base-content/60">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(new Date(`${date}T12:00:00Z`))
}
