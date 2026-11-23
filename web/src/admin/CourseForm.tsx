import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAdminStore, type Course } from './adminStore'
import { FormError } from './adminUi'

export function CourseForm({
  course,
  onCancel,
  onSaved
}: {
  course?: Course
  onCancel: () => void
  onSaved?: () => void
}): React.JSX.Element {
  const { people, createCourse, updateCourse, organization } = useAdminStore()
  const navigate = useNavigate()
  const [name, setName] = useState(course?.name ?? '')
  const [teacherId, setTeacherId] = useState(course?.teacherId ?? '')
  const [studentIds, setStudentIds] = useState<string[]>(course?.studentIds ?? [])
  const [error, setError] = useState('')
  const teachers = people.filter(
    (person) => person.organizationId === organization.id && person.roles.includes('teacher')
  )
  const students = people.filter(
    (person) => person.organizationId === organization.id && person.roles.includes('student')
  )

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const input = { name, teacherId, studentIds }
    const result = course ? updateCourse(course.id, input) : createCourse(input)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (onSaved) {
      onSaved()
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
      aria-label={course ? 'Editar curso' : 'Crear curso'}
    >
      <h2 className="text-lg font-semibold">{course ? 'Editar curso' : 'Nuevo curso'}</h2>
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
          {course ? 'Guardar cambios' : 'Guardar curso'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
