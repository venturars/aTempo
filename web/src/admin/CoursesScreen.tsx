import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useAdminStore, type Course } from './adminStore'
import { FormError, PageHeading } from './adminUi'

export function CoursesScreen({ mine = false }: { mine?: boolean }): React.JSX.Element {
  const { courses, people, currentPersonId, organization } = useAdminStore()
  const [creating, setCreating] = useState(false)
  const shown = courses.filter(
    (course) =>
      course.organizationId === organization.id && (!mine || course.teacherId === currentPersonId)
  )

  return (
    <>
      <PageHeading
        title={mine ? 'Mis clases' : 'Cursos'}
        description={
          mine ? 'Tus cursos y sesiones como profesor.' : 'Asigna el grupo y prepara sus sesiones.'
        }
      >
        {!mine && !creating ? (
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            Crear curso
          </button>
        ) : null}
      </PageHeading>
      {mine ? (
        <Link className="link w-fit text-sm" to="/admin">
          Volver a administración
        </Link>
      ) : null}
      {creating && !mine ? <CourseForm onCancel={() => setCreating(false)} /> : null}
      {shown.length === 0 ? (
        <p className="text-base-content/60">
          {mine
            ? 'Todavía no tienes cursos asignados.'
            : 'Todavía no hay cursos. Crea el primero para preparar una clase.'}
        </p>
      ) : (
        <div className="panel-card min-w-0 overflow-x-auto rounded-box">
          <table className="table panel-table">
            <caption className="sr-only">
              {mine ? 'Mis cursos' : 'Cursos de la organización'}
            </caption>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Profesor</th>
                <th>Alumnos</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((course) => (
                <tr key={course.id}>
                  <td className="font-medium">
                    <CourseLink course={course} mine={mine} />
                  </td>
                  <td>{people.find((person) => person.id === course.teacherId)?.name}</td>
                  <td>{course.studentIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CourseLink({ course, mine }: { course: Course; mine: boolean }): React.JSX.Element {
  return mine ? (
    <Link
      className="link link-hover"
      to="/admin/my-classes/$courseId"
      params={{ courseId: course.id }}
    >
      {course.name}
    </Link>
  ) : (
    <Link
      className="link link-hover"
      to="/admin/courses/$courseId"
      params={{ courseId: course.id }}
    >
      {course.name}
    </Link>
  )
}

function CourseForm({ onCancel }: { onCancel: () => void }): React.JSX.Element {
  const { people, createCourse, organization } = useAdminStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const teachers = people.filter(
    (person) => person.organizationId === organization.id && person.roles.includes('teacher')
  )
  const students = people.filter(
    (person) => person.organizationId === organization.id && person.roles.includes('student')
  )

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = createCourse({ name, teacherId, studentIds })
    if (!result.ok) {
      setError(result.error)
      return
    }
    void navigate({
      to: '/admin/courses/$courseId',
      params: { courseId: result.value.id }
    })
  }

  return (
    <form
      noValidate
      className="flex max-w-lg flex-col gap-5"
      onSubmit={onSubmit}
      aria-label="Crear curso"
    >
      <h2 className="text-lg font-semibold">Nuevo curso</h2>
      <div className="field">
        <label htmlFor="course-name">Nombre del curso</label>
        <input
          autoFocus
          id="course-name"
          className="input w-full"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="course-teacher">Profesor</label>
        <select
          id="course-teacher"
          className="select w-full"
          value={teacherId}
          onChange={(event) => setTeacherId(event.target.value)}
        >
          <option value="" disabled>
            Selecciona un profesor
          </option>
          {teachers.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.state === 'invited' ? ' · Invitación pendiente' : ''}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="field">
        <legend>Alumnos</legend>
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto py-2">
          {students.map((person) => (
            <label className="flex items-start gap-3 text-sm" key={person.id}>
              <input
                className="checkbox checkbox-sm mt-0.5"
                type="checkbox"
                checked={studentIds.includes(person.id)}
                onChange={(event) =>
                  setStudentIds((current) =>
                    event.target.checked
                      ? [...current, person.id]
                      : current.filter((id) => id !== person.id)
                  )
                }
              />
              <span>
                {person.name}
                {person.state === 'invited' ? (
                  <span className="block text-xs text-base-content/60">Invitación pendiente</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Guardar curso
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
