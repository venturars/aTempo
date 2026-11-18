import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAdminStore } from './adminStore'
import { FormError, PageHeading, PersonState, formatDate } from './adminUi'

export function CourseDetails({
  courseId,
  readOnly = false
}: {
  courseId: string
  readOnly?: boolean
}): React.JSX.Element {
  const { courses, sessions, people, currentPersonId, organization } = useAdminStore()
  const [creating, setCreating] = useState(false)
  const course = courses.find(
    (item) => item.id === courseId && item.organizationId === organization.id
  )

  if (!course || (readOnly && course.teacherId !== currentPersonId)) {
    return <UnavailableCourse readOnly={readOnly} />
  }

  const teacher = people.find(
    (person) => person.id === course.teacherId && person.organizationId === organization.id
  )
  const students = people.filter(
    (person) => person.organizationId === organization.id && course.studentIds.includes(person.id)
  )
  const courseSessions = sessions
    .filter(
      (session) => session.courseId === course.id && session.organizationId === organization.id
    )
    .sort((a, b) => `${a.date}${a.startsAt}`.localeCompare(`${b.date}${b.startsAt}`))

  return (
    <>
      <Link className="link w-fit text-sm" to={readOnly ? '/admin/my-classes' : '/admin/courses'}>
        {readOnly ? 'Volver a mis clases' : 'Volver a cursos'}
      </Link>
      <PageHeading
        title={course.name}
        description={`Profesor: ${teacher?.name ?? 'Sin asignar'}${teacher?.state === 'invited' ? ' · Invitación pendiente' : ''}`}
      >
        {!readOnly && !creating ? (
          <button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>
            Programar sesión
          </button>
        ) : null}
      </PageHeading>
      {creating && !readOnly ? (
        <SessionForm courseId={course.id} onCancel={() => setCreating(false)} />
      ) : null}
      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-lg font-semibold">Sesiones</h2>
        {courseSessions.length === 0 ? (
          <p className="text-base-content/60">Todavía no hay sesiones programadas.</p>
        ) : (
          <div className="panel-card min-w-0 overflow-x-auto rounded-box">
            <table className="table panel-table">
              <caption className="sr-only">Sesiones del curso</caption>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Aula</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {courseSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="font-medium">
                      {readOnly ? (
                        <Link
                          className="link link-hover"
                          to="/admin/my-classes/$courseId/$sessionId"
                          params={{
                            courseId: course.id,
                            sessionId: session.id
                          }}
                        >
                          {formatDate(session.date)}
                        </Link>
                      ) : (
                        <Link
                          className="link link-hover"
                          to="/admin/sessions/$sessionId"
                          params={{ sessionId: session.id }}
                        >
                          {formatDate(session.date)}
                        </Link>
                      )}
                    </td>
                    <td>
                      {session.startsAt}–{session.endsAt}
                    </td>
                    <td>{session.room}</td>
                    <td>Programada</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-lg font-semibold">Alumnos matriculados · {students.length}</h2>
        {students.length === 0 ? (
          <p className="text-base-content/60">Este curso todavía no tiene alumnos.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {students.map((person) => (
              <li className="flex flex-wrap items-center justify-between gap-2" key={person.id}>
                <span>{person.name}</span>
                <PersonState person={person} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function UnavailableCourse({ readOnly }: { readOnly: boolean }): React.JSX.Element {
  return (
    <>
      <PageHeading
        title="Curso no disponible"
        description="No se ha encontrado este curso en tu vista actual."
      />
      <Link className="link w-fit" to={readOnly ? '/admin/my-classes' : '/admin/courses'}>
        {readOnly ? 'Volver a mis clases' : 'Volver a cursos'}
      </Link>
    </>
  )
}

function SessionForm({
  courseId,
  onCancel
}: {
  courseId: string
  onCancel: () => void
}): React.JSX.Element {
  const createSession = useAdminStore((state) => state.createSession)
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [startsAt, setStartsAt] = useState('09:00')
  const [endsAt, setEndsAt] = useState('10:00')
  const [room, setRoom] = useState('')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = createSession({ courseId, date, startsAt, endsAt, room })
    if (!result.ok) {
      setError(result.error)
      return
    }
    void navigate({
      to: '/admin/sessions/$sessionId',
      params: { sessionId: result.value.id }
    })
  }

  return (
    <form
      noValidate
      className="flex max-w-lg flex-col gap-5"
      onSubmit={onSubmit}
      aria-label="Programar sesión"
    >
      <h2 className="text-lg font-semibold">Nueva sesión</h2>
      <div className="field">
        <label htmlFor="session-date">Fecha</label>
        <input
          autoFocus
          id="session-date"
          className="input w-full"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label htmlFor="session-start">Hora de inicio</label>
          <input
            id="session-start"
            className="input w-full"
            type="time"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="session-end">Hora de fin</label>
          <input
            id="session-end"
            className="input w-full"
            type="time"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="session-room">Aula</label>
        <input
          id="session-room"
          className="input w-full"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
        />
      </div>
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Guardar sesión
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
