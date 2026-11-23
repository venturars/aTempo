import { Link } from '@tanstack/react-router'
import { useAdminStore } from './adminStore'
import { PageHeading } from './adminUi'

export function AdminHome(): React.JSX.Element {
  const { organization, people, courses, sessions, currentPersonId } = useAdminStore()
  const currentPerson = people.find((person) => person.id === currentPersonId)
  const localPeople = people.filter((person) => person.organizationId === organization.id)
  const pending = localPeople.filter((person) => person.state === 'invited').length

  return (
    <>
      <PageHeading
        title={`Hola, ${currentPerson?.name.split(' ')[0] ?? ''}`}
        description={`Esta es la administración de ${organization.name}.`}
      />
      <div className="grid grid-cols-3 gap-6 py-2">
        {[
          ['Personas', localPeople.length],
          ['Cursos', courses.filter((course) => course.organizationId === organization.id).length],
          [
            'Sesiones',
            sessions.filter((session) => session.organizationId === organization.id).length
          ]
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <p className="text-3xl font-semibold">{value}</p>
            <p className="text-sm text-base-content/60">{label}</p>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold">Prepara tu próxima clase</h2>
          <p className="mt-2 text-base-content/60">
            Empieza por las personas. Después, reúne al grupo en un curso y programa sus sesiones.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-primary" to="/admin/people">
            Gestionar personas
          </Link>
          <Link className="btn" to="/admin/courses">
            Ver cursos
          </Link>
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Invitaciones</h2>
        <p className="text-base-content/65">
          {pending === 0
            ? 'No tienes invitaciones pendientes.'
            : `${pending} personas tienen una invitación pendiente de activar.`}
        </p>
      </section>
    </>
  )
}
