import { useState, type FormEvent } from 'react'
import { useAdminStore } from './adminStore'
import { FormError, PageHeading, PersonState, personRole } from './adminUi'

export function PeopleScreen(): React.JSX.Element {
  const people = useAdminStore((state) => state.people)
  const organization = useAdminStore((state) => state.organization)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')

  return (
    <>
      <PageHeading title="Personas" description="El equipo y los alumnos de tu organización.">
        {!creating ? (
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
        <InvitationForm
          onCancel={() => setCreating(false)}
          onCreated={(name) => {
            setCreating(false)
            setNotice(`Invitación preparada para ${name}. Queda pendiente de activación.`)
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
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function InvitationForm({
  onCancel,
  onCreated
}: {
  onCancel: () => void
  onCreated: (name: string) => void
}): React.JSX.Element {
  const invitePerson = useAdminStore((state) => state.invitePerson)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = invitePerson({ name, email, role })
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCreated(result.value.name)
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-lg flex-col gap-5"
      aria-label="Invitar persona"
    >
      <h2 className="text-lg font-semibold">Nueva invitación</h2>
      <div className="field">
        <label htmlFor="invite-name">Nombre completo</label>
        <input
          autoFocus
          id="invite-name"
          className="input w-full"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label htmlFor="invite-email">Correo</label>
        <input
          id="invite-email"
          className="input w-full"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="invite-role">Rol</label>
        <select
          id="invite-role"
          className="select w-full"
          value={role}
          onChange={(event) => setRole(event.target.value as 'teacher' | 'student')}
        >
          <option value="student">Alumno</option>
          <option value="teacher">Profesor</option>
        </select>
      </div>
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Preparar invitación
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
