import { useEffect, useId, useState } from 'react'
import { useSettingsStore } from './settingsStore'
import { rosterNames, todayEntry } from './roster'

function Bell(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 21h6" />
    </svg>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}): React.JSX.Element {
  const id = useId()
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 border-t border-base-content/4 py-3 first:border-t-0">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span id={id} className="mt-0.5 block text-sm leading-snug text-base-content/60">
          {description}
        </span>
      </span>
      <input
        aria-label={label}
        aria-describedby={id}
        type="checkbox"
        className="toggle toggle-sm toggle-primary shrink-0"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export function SettingsView(): React.JSX.Element {
  const preferences = useSettingsStore()
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? 'atempo-oscuro'
  )
  const [notice, setNotice] = useState(0)
  const [paused, setPaused] = useState(false)
  const missing = rosterNames.filter((_, index) => todayEntry[index] === '—')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    if (!notice || paused) return
    const timer = window.setTimeout(() => setNotice(0), 8000)
    return () => window.clearTimeout(timer)
  }, [notice, paused])
  const notifications = [
    {
      key: 'arrival',
      label: 'Llegada de alumnos',
      description: 'Cuando un alumno registra su asistencia.'
    },
    {
      key: 'beforeStart',
      label: 'Antes de empezar la clase',
      description: 'Recibe un recordatorio 5 minutos antes del inicio.'
    },
    {
      key: 'beforeLate',
      label: 'Alumnos que faltan por llegar',
      description: 'Recibe la lista 1 minuto antes de que empiecen a contar los retrasos.'
    },
    {
      key: 'lateSummary',
      label: 'Resumen de retrasos',
      description: 'Recibe el resumen de retrasos y ausencias al terminar el margen.'
    },
    {
      key: 'beforeEnd',
      label: 'Alumnos que no han asistido',
      description: 'Recibe sus nombres 1 minuto antes del final de la clase.'
    }
  ] as const
  return (
    <div className="flex flex-col gap-5">
      <section className="card bg-base-100 shadow-sm" aria-labelledby="session-settings">
        <div className="card-body gap-3">
          <h2 id="session-settings" className="text-lg font-medium">
            Registro de asistencia
          </h2>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label htmlFor="late-minutes" className="text-sm font-medium">
                Margen de retraso
              </label>
              <div className="join">
                <button
                  type="button"
                  className="btn btn-sm btn-square join-item"
                  aria-label="Reducir margen de retraso"
                  disabled={preferences.lateMinutes === 0}
                  onClick={() => preferences.update({ lateMinutes: preferences.lateMinutes - 1 })}
                >
                  −
                </button>
                <label className="input input-sm join-item minute-stepper">
                  <input
                    id="late-minutes"
                    aria-describedby="late-help"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    className="prototype-minutes text-center text-sm font-medium tabular-nums"
                    value={preferences.lateMinutes}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber
                      if (Number.isInteger(value) && value >= 0 && value <= 60)
                        preferences.update({ lateMinutes: value })
                    }}
                  />
                  <span className="text-sm text-base-content/60">min</span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-square join-item"
                  aria-label="Aumentar margen de retraso"
                  disabled={preferences.lateMinutes === 60}
                  onClick={() => preferences.update({ lateMinutes: preferences.lateMinutes + 1 })}
                >
                  +
                </button>
              </div>
            </div>
            <p id="late-help" className="mt-2 text-sm text-base-content/60">
              Llegar en los primeros {preferences.lateMinutes} minutos es puntual.
            </p>
          </div>
        </div>
      </section>
      <section className="card bg-base-100 shadow-sm" aria-labelledby="notification-settings">
        <div className="card-body gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="notification-settings" className="text-lg font-medium">
              Notificaciones
            </h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setPaused(false)
                setNotice((value) => value + 1)
              }}
            >
              <Bell />
              Probar notificación
            </button>
          </div>
          <div>
            {notifications.map((item) => (
              <Toggle
                key={item.key}
                label={item.label}
                description={item.description}
                checked={preferences[item.key]}
                onChange={(checked) => preferences.update({ [item.key]: checked })}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="card bg-base-100 shadow-sm" aria-labelledby="theme-settings">
        <div className="card-body gap-3">
          <h2 id="theme-settings" className="text-lg font-medium">
            Tema
          </h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Apariencia</span>
            <div className="join">
              {[
                { value: 'atempo-oscuro', label: 'Noche' },
                { value: 'atempo-claro', label: 'Tinta' }
              ].map((option) => (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={theme === option.value}
                  className={`btn btn-sm join-item min-w-24 ${theme === option.value ? 'btn-primary' : ''}`}
                  onClick={() => setTheme(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div role="status" aria-live="polite" className="toast toast-end toast-bottom z-50">
        {notice > 0 ? (
          <div
            key={notice}
            className="alert w-[min(380px,calc(100vw-32px))] bg-base-100 p-4 text-base-content shadow-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <Bell />
            <div>
              <p className="text-sm font-medium">La clase termina en un minuto</p>
              <p className="mt-1 text-sm text-base-content/60">
                {missing.length === 1
                  ? '1 alumno no ha asistido: '
                  : `${missing.length} alumnos no han asistido: `}
                {missing.map((name) => name.split(' ')[0]).join(', ')}.
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar notificación"
              className="btn btn-xs btn-square"
              onClick={() => {
                setNotice(0)
                setPaused(false)
              }}
            >
              ×
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
