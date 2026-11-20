import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useAdminStore,
  previewRecurringSessions,
  type ClassSession,
  type RecurringSessionResult
} from './adminStore'
import { FormError, formatDate } from './adminUi'

export function SessionForm({
  courseId,
  session,
  onCancel,
  onSaved,
  onRecurringSaved
}: {
  courseId: string
  session?: ClassSession
  onCancel: () => void
  onSaved?: () => void
  onRecurringSaved?: (result: RecurringSessionResult) => void
}): React.JSX.Element {
  const createSession = useAdminStore((state) => state.createSession)
  const updateSession = useAdminStore((state) => state.updateSession)
  const state = useAdminStore()
  const navigate = useNavigate()
  const [weekly, setWeekly] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [date, setDate] = useState(session?.date ?? '')
  const [startsAt, setStartsAt] = useState(session?.startsAt ?? '09:00')
  const [endsAt, setEndsAt] = useState(session?.endsAt ?? '10:00')
  const [room, setRoom] = useState(session?.room ?? '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const recurrenceInput = { courseId, startDate: date, endDate, weekdays, startsAt, endsAt, room }
  const preview = weekly ? previewRecurringSessions(state, recurrenceInput) : null

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setError('')
    setNotice('')
    if (weekly && !session) {
      const result = state.createRecurringSessions(recurrenceInput)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.value.sessions.length === 0) {
        setNotice(`Nada nuevo: las ${result.value.candidateCount} sesiones ya existen.`)
        return
      }
      if (onRecurringSaved) onRecurringSaved(result.value)
      else void navigate({ to: '/admin/courses/$courseId', params: { courseId } })
      return
    }
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
      onChange={() => {
        setError('')
        setNotice('')
      }}
      aria-label={session ? 'Editar sesión' : 'Programar sesión'}
    >
      <h2 className="text-lg font-semibold">{session ? 'Editar sesión' : 'Nueva sesión'}</h2>
      {!session ? (
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 font-medium">Repetición</legend>
          {[false, true].map((value) => (
            <label className="flex min-h-11 items-center gap-2" key={String(value)}>
              <input
                className="radio"
                type="radio"
                name="session-repetition"
                checked={weekly === value}
                onChange={() => setWeekly(value)}
              />
              {value ? 'Semanal' : 'Una sesión'}
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="field">
        <label htmlFor="session-date">{weekly ? 'Fecha inicial' : 'Fecha'}</label>
        <input
          autoFocus
          id="session-date"
          className="input w-full"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      {weekly ? (
        <>
          <div className="field">
            <label htmlFor="session-end-date">Fecha final (incluida)</label>
            <input
              id="session-end-date"
              className="input w-full"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <fieldset>
            <legend className="mb-2 font-medium">Días de la semana</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                [1, 'Lunes'],
                [2, 'Martes'],
                [3, 'Miércoles'],
                [4, 'Jueves'],
                [5, 'Viernes'],
                [6, 'Sábado'],
                [0, 'Domingo']
              ].map(([day, label]) => (
                <label className="flex min-h-11 items-center gap-2" key={day}>
                  <input
                    className="checkbox"
                    type="checkbox"
                    checked={weekdays.includes(Number(day))}
                    onChange={(event) =>
                      setWeekdays((current) =>
                        event.target.checked
                          ? [...current, Number(day)]
                          : current.filter((value) => value !== Number(day))
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}
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
      {preview?.ok ? (
        <section className="flex flex-col gap-2" aria-label="Vista previa" aria-live="polite">
          <h3 className="font-semibold">Vista previa</h3>
          <p>
            {preview.value.candidateCount} coincidencias · {preview.value.newDates.length} por crear
            · {preview.value.skippedCount} ya existentes.
          </p>
          <p>
            {formatDate(preview.value.dates[0])} –{' '}
            {formatDate(preview.value.dates[preview.value.dates.length - 1])}. Máximo 366 sesiones
            por lote.
          </p>
          <details>
            <summary className="cursor-pointer">Ver fechas</summary>
            <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
              {preview.value.dates.map((value) => (
                <li key={value}>
                  {formatDate(value)}
                  {preview.value.newDates.includes(value) ? '' : ' · Ya existe'}
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
      <FormError message={error} />
      {notice ? <p role="status">{notice}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          {session ? 'Guardar cambios' : weekly ? 'Guardar sesiones' : 'Guardar sesión'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
