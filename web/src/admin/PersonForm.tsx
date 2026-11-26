import { useState, type FormEvent } from 'react'
import { useAdminStore, type Person } from './adminStore'
import { FormError } from './adminUi'

type PersonFields = {
  firstName: string
  lastName: string
  identificationDocument: string
  email: string
  birthDate: string
  phone: string
}

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
  const updateAdmin = useAdminStore((state) => state.updateAdmin)
  // El admin es único: en su cuenta no elige rol, solo si también da clase.
  const isAdmin = person?.roles.includes('admin') ?? false
  const [fields, setFields] = useState<PersonFields>({
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    identificationDocument: person?.identificationDocument ?? '',
    email: person?.email ?? '',
    birthDate: person?.birthDate ?? '',
    phone: person?.phone ?? ''
  })
  const [role, setRole] = useState<'teacher' | 'student'>(
    person?.roles.includes('teacher') ? 'teacher' : 'student'
  )
  const [teaches, setTeaches] = useState(person?.roles.includes('teacher') ?? false)
  const [error, setError] = useState('')

  function change(field: keyof PersonFields, value: string): void {
    setFields((current) => ({ ...current, [field]: value }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = isAdmin
      ? updateAdmin({ ...fields, teaches })
      : person
        ? updatePerson(person.id, { ...fields, role })
        : invitePerson({ ...fields, role })
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
      className="flex max-w-2xl flex-col gap-5"
      aria-label={person ? 'Editar persona' : 'Invitar persona'}
    >
      <h2 className="text-lg font-semibold">{person ? 'Editar persona' : 'Nueva invitación'}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          autoFocus
          id="person-first-name"
          label="Nombre"
          autoComplete="given-name"
          value={fields.firstName}
          onChange={(value) => change('firstName', value)}
        />
        <TextField
          id="person-last-name"
          label="Apellidos"
          autoComplete="family-name"
          value={fields.lastName}
          onChange={(value) => change('lastName', value)}
        />
        <TextField
          id="person-document"
          label="Documento de identidad"
          hint="DNI, NIE o pasaporte."
          autoComplete="off"
          value={fields.identificationDocument}
          onChange={(value) => change('identificationDocument', value)}
        />
        <TextField
          id="person-email"
          label="Correo"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={(value) => change('email', value)}
        />
        <TextField
          id="person-birth-date"
          label="Fecha de nacimiento (opcional)"
          type="date"
          autoComplete="off"
          value={fields.birthDate}
          onChange={(value) => change('birthDate', value)}
        />
        <TextField
          id="person-phone"
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={(value) => change('phone', value)}
        />
      </div>
      {isAdmin ? (
        <label className="flex items-center gap-3">
          <input
            className="toggle toggle-primary"
            type="checkbox"
            role="switch"
            checked={teaches}
            onChange={(event) => setTeaches(event.target.checked)}
          />
          También soy profesor
        </label>
      ) : (
        <div className="field sm:max-w-xs">
          <label htmlFor="person-role">Rol</label>
          <select
            id="person-role"
            className="select w-full"
            value={role}
            onChange={(event) => setRole(event.target.value === 'teacher' ? 'teacher' : 'student')}
          >
            <option value="student">Alumno</option>
            <option value="teacher">Profesor</option>
          </select>
        </div>
      )}
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

function TextField({
  id,
  label,
  hint = '',
  type = 'text',
  autoComplete,
  autoFocus = false,
  value,
  onChange
}: {
  id: string
  label: string
  hint?: string
  type?: 'text' | 'email' | 'date' | 'tel'
  autoComplete: string
  autoFocus?: boolean
  value: string
  onChange: (value: string) => void
}): React.JSX.Element {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        autoFocus={autoFocus}
        id={id}
        className="input w-full"
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-base-content/60">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
