import { useEffect, useId, useState } from 'react'
import { useSettingsStore } from './settingsStore'
import { rosterNames, todayEntry } from './roster'
import './prototype.css'

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
    <label className="flex cursor-pointer items-center justify-between gap-5 py-2.5">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span id={id} className="mt-0.5 block text-sm leading-snug text-base-content/70">
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
    <div className="settings-view mx-auto grid w-full max-w-[760px] gap-6">
      <section aria-labelledby="session-settings">
        <h2 id="session-settings" className="mb-3 text-base font-semibold">
          Registro de asistencia
        </h2>
        <div className="card settings-surface bg-base-100 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label htmlFor="late-minutes" className="text-sm font-medium">
              Margen de retraso
            </label>
            <div className="join minutes-control">
              <button
                type="button"
                className="btn btn-sm btn-square join-item"
                aria-label="Reducir margen de retraso"
                disabled={preferences.lateMinutes === 0}
                onClick={() => preferences.update({ lateMinutes: preferences.lateMinutes - 1 })}
              >
                −
              </button>
              <label className="input input-sm join-item w-24 gap-1">
                <input
                  id="late-minutes"
                  aria-describedby="late-help"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  className="prototype-minutes min-w-0 text-center text-sm font-medium tabular-nums"
                  value={preferences.lateMinutes}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber
                    if (Number.isInteger(value) && value >= 0 && value <= 60)
                      preferences.update({ lateMinutes: value })
                  }}
                />
                <span className="text-xs text-base-content/70">min</span>
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
          <p id="late-help" className="mt-2 text-sm text-base-content/70">
            Durante los primeros {preferences.lateMinutes} minutos de clase, las llegadas cuentan
            como puntuales.
          </p>
        </div>
      </section>
      <section aria-labelledby="notification-settings">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="notification-settings" className="text-base font-semibold">
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
        <div className="card settings-surface bg-base-100 px-4 py-1">
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
      </section>
      <section aria-labelledby="theme-settings">
        <h2 id="theme-settings" className="mb-3 text-base font-semibold">
          Aspecto
        </h2>
        <div className="card settings-surface theme-setting bg-base-100">
          <span className="text-sm">Tema de la aplicación</span>
          <div className="join">
            {[
              { value: 'atempo-claro', label: 'Claro' },
              { value: 'atempo-oscuro', label: 'Oscuro' }
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
      </section>
      <div role="status" aria-live="polite" className="toast toast-end toast-bottom z-50">
        {notice > 0 ? (
          <div
            key={notice}
            className="alert prototype-toast w-[min(380px,calc(100vw-32px))] bg-base-100 p-4 text-base-content"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <Bell />
            <div>
              <p className="text-sm font-semibold">La clase termina en un minuto</p>
              <p className="mt-1 text-sm text-base-content/70">
                {missing.length} alumnos no han asistido:{' '}
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
