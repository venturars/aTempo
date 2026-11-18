import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAdminStore, type ClassSession } from './adminStore'
import { FormError } from './adminUi'

export function SessionForm({
  courseId,
  session,
  onCancel,
  onSaved
}: {
  courseId: string
  session?: ClassSession
  onCancel: () => void
  onSaved?: () => void
}): React.JSX.Element {
  const createSession = useAdminStore((state) => state.createSession)
  const updateSession = useAdminStore((state) => state.updateSession)
  const navigate = useNavigate()
  const [date, setDate] = useState(session?.date ?? '')
  const [startsAt, setStartsAt] = useState(session?.startsAt ?? '09:00')
  const [endsAt, setEndsAt] = useState(session?.endsAt ?? '10:00')
  const [room, setRoom] = useState(session?.room ?? '')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const input = { courseId, date, startsAt, endsAt, room }
    const result = session ? updateSession(session.id, input) : createSession(input)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (onSaved) {
      onSaved()
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
      aria-label={session ? 'Editar sesión' : 'Programar sesión'}
    >
      <h2 className="text-lg font-semibold">{session ? 'Editar sesión' : 'Nueva sesión'}</h2>
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
          {session ? 'Guardar cambios' : 'Guardar sesión'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
