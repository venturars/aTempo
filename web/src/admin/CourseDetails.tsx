import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAdminStore } from './adminStore'
import { CourseForm } from './CourseForm'
import { SessionForm } from './SessionForm'
import { DeleteConfirmation } from './DeleteConfirmation'
import { PageHeading, PersonState, formatDate } from './adminUi'

export function CourseDetails({
  courseId,
  readOnly = false
}: {
  courseId: string
  readOnly?: boolean
}): React.JSX.Element {
  const { courses, sessions, people, currentPersonId, organization } = useAdminStore()
  const [creating, setCreating] = useState(false)
  const [sessionNotice, setSessionNotice] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const deleteCourse = useAdminStore((state) => state.deleteCourse)
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
        {!readOnly && !creating && !editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setSessionNotice('')
                setCreating(true)
              }}
            >
              Programar sesión
            </button>
            <button className="btn" type="button" onClick={() => setEditing(true)}>
              Editar curso
            </button>
            <button
              className="btn btn-ghost text-error"
              type="button"
              onClick={() => setDeleting(true)}
            >
              Eliminar curso
            </button>
          </div>
        ) : null}
      </PageHeading>
      {editing && !readOnly ? (
        <CourseForm
          key={course.id}
          course={course}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : null}
      {deleting && !readOnly ? (
        <DeleteConfirmation
          title="Eliminar curso"
          description={`Se eliminará «${course.name}» y sus ${courseSessions.length} sesiones programadas. Las personas seguirán en la organización.`}
          onConfirm={() => deleteCourse(course.id)}
          onCancel={() => setDeleting(false)}
          onDeleted={() => {
            void navigate({ to: '/admin/courses' })
          }}
        />
      ) : null}
      {creating && !readOnly ? (
        <SessionForm
          courseId={course.id}
          onCancel={() => setCreating(false)}
          onRecurringSaved={(result) => {
            setCreating(false)
            setSessionNotice(
              `${result.sessions.length} sesiones creadas de ${result.candidateCount} coincidencias. ${result.skippedCount} ya existentes omitidas.`
            )
          }}
        />
      ) : null}
      {sessionNotice ? <p role="status">{sessionNotice}</p> : null}
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
