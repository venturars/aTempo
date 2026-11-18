import { useState, type FormEvent } from 'react'
import { useAdminStore, type Person } from './adminStore'
import { FormError, personRole } from './adminUi'

export function PersonForm({
  person,
  onCancel,
  onSaved
}: {
  person?: Person
  onCancel: () => void
  onSaved: (name: string) => void
}): React.JSX.Element {
  const invitePerson = useAdminStore((state) => state.invitePerson)
  const updatePerson = useAdminStore((state) => state.updatePerson)
  const [name, setName] = useState(person?.name ?? '')
  const [email, setEmail] = useState(person?.email ?? '')
  const [role, setRole] = useState<'teacher' | 'student'>(
    person?.roles.includes('teacher') ? 'teacher' : 'student'
  )
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const input = { name, email, role }
    const result = person ? updatePerson(person.id, input) : invitePerson(input)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSaved(result.value.name)
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex max-w-lg flex-col gap-5"
      aria-label={person ? 'Editar persona' : 'Invitar persona'}
    >
      <h2 className="text-lg font-semibold">{person ? 'Editar persona' : 'Nueva invitación'}</h2>
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
        {person?.roles.includes('admin') ? (
          <input id="invite-role" className="input w-full" value={personRole(person)} readOnly />
        ) : (
          <select
            id="invite-role"
            className="select w-full"
            value={role}
            onChange={(event) => setRole(event.target.value as 'teacher' | 'student')}
          >
            <option value="student">Alumno</option>
            <option value="teacher">Profesor</option>
          </select>
        )}
      </div>
      {person?.roles.includes('admin') ? (
        <p className="text-sm text-base-content/60">
          Esta cuenta conserva su rol de administrador.
        </p>
      ) : null}
      <FormError message={error} />
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          {person ? 'Guardar cambios' : 'Preparar invitación'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
