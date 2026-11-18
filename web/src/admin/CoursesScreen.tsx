import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAdminStore, type Course } from './adminStore'
import { PageHeading } from './adminUi'
import { CourseForm } from './CourseForm'

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
