import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { StudentLayout } from '../StudentLayout'
import { Tempito } from '../mascot/Tempito'
import { readNoticesFor } from '../notice/studentNotices'
import { useCurrentStudent } from '../studentAccounts'
import { greetingForHour } from '../studentDate'
import { canRegister, homeStateFor, moodFor, subtitleFor } from './homeState'

const previewDays = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

// Solo en desarrollo, para enseñar los estados en la demo:
//   /student/dashboard?hora=08:50          → otra hora de hoy
//   /student/dashboard?hora=08:59:45       → con segundos
//   /student/dashboard?dia=sab&hora=10:00  → otro día de esta semana
function previewTime(): Date | null {
  if (!import.meta.env.DEV) return null
  const params = new URLSearchParams(window.location.search)
  const hourParam = params.get('hora')
  const dayParam = params.get('dia')
  if (hourParam === null && dayParam === null) return null

  const preview = new Date()
  const time = hourParam === null ? null : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(hourParam)
  if (time !== null) preview.setHours(Number(time[1]), Number(time[2]), Number(time[3] ?? 0), 0)
  const weekday = dayParam === null ? -1 : previewDays.indexOf(dayParam)
  if (weekday !== -1) preview.setDate(preview.getDate() + (weekday - preview.getDay()))
  return preview
}

// La hora actual, puesta al día cada segundo: Tempito se agobia solo en los últimos 30 segundos.
// Con ?hora= la hora de la vista previa avanza también, para ver el cambio de ánimo.
function useNow(): Date {
  const [now, setNow] = useState(() => previewTime() ?? new Date())
  useEffect(() => {
    const isPreview = previewTime() !== null
    const timer = window.setInterval(() => {
      setNow((current) => (isPreview ? new Date(current.getTime() + 1000) : new Date()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

export function DashboardScreen(): React.JSX.Element {
  const now = useNow()
  const student = useCurrentStudent()
  const firstName = student.name.trim().split(/\s+/)[0] ?? ''
  // Los avisos solo cambian desde Avisar, que vuelve a montar esta pantalla.
  const notices = useMemo(() => readNoticesFor(student.email), [student.email])
  const state = homeStateFor(now, student.history, notices)

  return (
    <StudentLayout place="center">
      <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <Tempito mood={moodFor(state, now)} className="-mb-4 w-40 sm:w-48" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {state.kind === 'registered' ? (
              inClassGreeting(firstName, `${student.email} ${now.toDateString()}`)
            ) : (
              <>
                {greetingForHour(now.getHours())},{' '}
                <span className="whitespace-nowrap">{firstName}</span>
              </>
            )}
          </h1>
          <p className="text-lg tabular-nums text-base-content/60 sm:text-xl">
            {subtitleFor(state)}
          </p>
        </div>
        {canRegister(state) ? (
          <Link
            id="registrar-asistencia"
            className="btn btn-primary btn-lg w-full max-w-xs"
            to="/student/scan"
          >
            Registrar asistencia
          </Link>
        ) : null}
      </div>
    </StudentLayout>
  )
}

const inClassPhrases = [
  (name: string) => `Disfruta tu clase, ${name}`,
  (name: string) => `Ya estás dentro, ${name}`,
  (name: string) => `Aprovecha la clase, ${name}`,
  (name: string) => `A por ello, ${name}`
]

// Ya está en clase: cada alumno ve una frase de ánimo, y cambia de un día a otro.
// La frase sale de la semilla (correo y día), así no cambia al volver a la pantalla.
function inClassGreeting(firstName: string, seed: string): string {
  const total = [...seed].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
  const phrase = inClassPhrases[total % inClassPhrases.length] ?? inClassPhrases[0]
  return phrase(firstName)
}
