import { useState } from 'react'
import { useAdminStore, type Person } from './adminStore'
import { PersonForm } from './PersonForm'
import { DeleteConfirmation } from './DeleteConfirmation'
import { PageHeading, PersonState, personRole } from './adminUi'

export function PeopleScreen(): React.JSX.Element {
  const people = useAdminStore((state) => state.people)
  const organization = useAdminStore((state) => state.organization)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Person | null>(null)
  const [deleting, setDeleting] = useState<Person | null>(null)
  const { courses, currentPersonId, deletePerson } = useAdminStore()

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
      <div className="panel-card min-w-0 overflow-x-auto rounded-box">
        <table className="table panel-table">
          <caption className="sr-only">Personas de la organización</caption>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {people
              .filter((person) => person.organizationId === organization.id)
              .map((person) => (
                <tr key={person.id}>
                  <td className="font-medium">{person.name}</td>
                  <td>{person.email}</td>
                  <td>{personRole(person)}</td>
                  <td>
                    <PersonState person={person} />
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
                      ) : (
                        <span className="self-center text-xs text-base-content/60">
                          No puedes eliminar tu propia cuenta.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
