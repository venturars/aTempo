import { useState } from 'react'
import { useAdminStore, type Person } from './adminStore'
import { PersonForm } from './PersonForm'
import { DeleteConfirmation } from './DeleteConfirmation'
import { PageHeading, PersonState, personRole } from './adminUi'
import { filterPeople, noPeopleFilters, type PeopleFilters } from './peopleFilters'

export function PeopleScreen(): React.JSX.Element {
  const people = useAdminStore((state) => state.people)
  const organization = useAdminStore((state) => state.organization)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Person | null>(null)
  const [deleting, setDeleting] = useState<Person | null>(null)
  const [filters, setFilters] = useState<PeopleFilters>(noPeopleFilters)
  const { courses, currentPersonId, deletePerson } = useAdminStore()
  const organizationCourses = courses.filter((course) => course.organizationId === organization.id)
  const visiblePeople = filterPeople(
    people.filter((person) => person.organizationId === organization.id),
    organizationCourses,
    filters
  )

  function changeFilters(change: Partial<PeopleFilters>): void {
    setFilters({ ...filters, ...change })
  }

  return (
    <>
      <PageHeading title="Personas" description="El equipo y los alumnos de tu organización.">
        {!creating && !editing ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setNotice('')
              setCreating(true)
            }}
          >
            Invitar persona
          </button>
        ) : null}
      </PageHeading>
      {creating ? (
        <PersonForm
          onCancel={() => setCreating(false)}
          onSaved={(name) => {
            setCreating(false)
            setNotice(`Invitación preparada para ${name}. Queda pendiente de activación.`)
          }}
        />
      ) : null}
      {editing ? (
        <PersonForm
          key={editing.id}
          person={editing}
          onCancel={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null)
            setNotice(`Datos de ${name} actualizados.`)
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteConfirmation
          title="Eliminar persona"
          description={
            deleting.roles.includes('student')
              ? `Se eliminará a ${deleting.name} y su matrícula en ${courses.filter((course) => course.organizationId === organization.id && course.studentIds.includes(deleting.id)).length} cursos. Las sesiones y los demás alumnos se conservarán.`
              : `Se eliminará a ${deleting.name}. Si tiene cursos asignados, tendrás que reasignarlos antes.`
          }
          onConfirm={() => deletePerson(deleting.id)}
          onCancel={() => setDeleting(null)}
          onDeleted={() => {
            if (editing?.id === deleting.id) setEditing(null)
            setDeleting(null)
            setNotice('Persona eliminada.')
          }}
        />
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-success">
          {notice}
        </p>
      ) : null}
      {creating || editing ? null : (
        <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="field sm:flex-1">
            <label htmlFor="people-filter-name">Nombre</label>
            <input
              id="people-filter-name"
              className="input w-full"
              type="search"
              value={filters.name}
              onChange={(event) => changeFilters({ name: event.target.value })}
            />
          </div>
          <div className="field sm:w-48">
            <label htmlFor="people-filter-role">Rol</label>
            <select
              id="people-filter-role"
              className="select w-full"
              value={filters.role}
              onChange={(event) =>
                changeFilters({ role: event.target.value as PeopleFilters['role'] })
              }
            >
              <option value="">Todos</option>
              <option value="teacher">Profesor</option>
              <option value="student">Alumno</option>
            </select>
          </div>
          <div className="field sm:w-56">
            <label htmlFor="people-filter-course">Curso</label>
            <select
              id="people-filter-course"
              className="select w-full"
              value={filters.courseId}
              onChange={(event) => changeFilters({ courseId: event.target.value })}
            >
              <option value="">Todos</option>
              {organizationCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {visiblePeople.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-base-content/60">Nadie coincide con los filtros.</p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => changeFilters(noPeopleFilters)}
            >
              Quitar filtros
            </button>
          </div>
        ) : (
        <div className="panel-card min-w-0 overflow-x-auto rounded-box">
        <table className="table panel-table">
          <caption className="sr-only">Personas de la organización</caption>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visiblePeople.map((person) => (
                <tr key={person.id}>
                  <td>
                    <span className="font-medium">{person.name}</span>
                    {person.id === currentPersonId ? (
                      <span className="mt-1 block max-w-40 whitespace-normal text-xs text-base-content/60">
                        No puedes eliminar tu propia cuenta.
                      </span>
                    ) : null}
                  </td>
                  <td>{person.identificationDocument}</td>
                  <td>{person.email}</td>
                  <td>{personRole(person)}</td>
                  {/* «Invitación pendiente» parte línea si no cabe, para que Eliminar no se salga a 1280 px. */}
                  <td>
                    <span className="whitespace-normal">
                      <PersonState person={person} />
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={`Editar ${person.name}`}
                        onClick={() => {
                          setCreating(false)
                          setEditing(person)
                          setNotice('')
                        }}
                      >
                        Editar
                      </button>
                      {person.id !== currentPersonId ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          aria-label={`Eliminar ${person.name}`}
                          onClick={() => setDeleting(person)}
                        >
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
        )}
        </div>
      )}
    </>
  )
}
