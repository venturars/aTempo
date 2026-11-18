import { Link } from '@tanstack/react-router'
import { useAdminStore } from './adminStore'
import { PageHeading, PersonState, formatDate } from './adminUi'

export function SessionDetails({
  sessionId,
  courseId,
  readOnly = false
}: {
  sessionId: string
  courseId?: string
  readOnly?: boolean
}): React.JSX.Element {
  const { sessions, courses, people, currentPersonId, organization } = useAdminStore()
  const session = sessions.find(
    (item) => item.id === sessionId && item.organizationId === organization.id
  )
  const course = courses.find(
    (item) => item.id === session?.courseId && item.organizationId === organization.id
  )
  if (
    !session ||
    !course ||
    (readOnly && (course.teacherId !== currentPersonId || course.id !== courseId))
  ) {
    return (
      <>
        <PageHeading
          title="Sesión no disponible"
          description="No se ha encontrado esta sesión en tu vista actual."
        />
        <Link className="link w-fit" to={readOnly ? '/admin/my-classes' : '/admin/courses'}>
          Volver a cursos
        </Link>
      </>
    )
  }
  const students = people.filter(
    (person) => person.organizationId === organization.id && course.studentIds.includes(person.id)
  )
  const teacher = people.find(
    (person) => person.id === course.teacherId && person.organizationId === organization.id
  )

  return (
    <>
      {readOnly ? (
        <Link
          className="link w-fit text-sm"
          to="/admin/my-classes/$courseId"
          params={{ courseId: course.id }}
        >
          Volver al curso
        </Link>
      ) : (
        <Link
          className="link w-fit text-sm"
          to="/admin/courses/$courseId"
          params={{ courseId: course.id }}
        >
          Volver al curso
        </Link>
      )}
      <PageHeading
        title={course.name}
        description={`${formatDate(session.date)} · ${session.startsAt}–${session.endsAt}`}
      />
      <dl className="flex flex-wrap gap-x-12 gap-y-5">
        <div>
          <dt className="text-sm text-base-content/60">Profesor</dt>
          <dd className="mt-1">
            {teacher?.name}
            {teacher?.state === 'invited' ? ' · Invitación pendiente' : ''}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-base-content/60">Aula</dt>
          <dd className="mt-1">{session.room}</dd>
        </div>
        <div>
          <dt className="text-sm text-base-content/60">Estado</dt>
          <dd className="mt-1">Programada</dd>
        </div>
      </dl>
      <section className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Listado de alumnos · {students.length}</h2>
          <p className="mt-2 text-base-content/60">
            El grupo está preparado. La asistencia se registrará al abrir la lista desde el panel
            del profesor.
          </p>
        </div>
        {students.length === 0 ? (
          <p className="text-base-content/60">Este curso todavía no tiene alumnos matriculados.</p>
        ) : (
          <div className="panel-card min-w-0 overflow-x-auto rounded-box">
            <table className="table panel-table">
              <caption className="sr-only">Listado de la sesión</caption>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Cuenta</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {students.map((person) => (
                  <tr key={person.id}>
                    <td className="font-medium">{person.name}</td>
                    <td>
                      <PersonState person={person} />
                    </td>
                    <td>Pendiente</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
