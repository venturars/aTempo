import type { ClassEntry } from '../studentExample'
import { todayClass } from '../studentExample'
import { formatDay } from '../studentDate'
import type { StudentNotice } from '../notice/studentNotices'
import { moodBeforeDeadline, secondsUntil, type TempitoMood } from '../mascot/tempitoMood'

// Lo que pasa hoy, visto desde la pantalla de inicio. Cada caso trae lo que la pantalla necesita enseñar.
export type HomeState =
  | { kind: 'no-class' }
  | { kind: 'registered'; arrival: string }
  | { kind: 'absent-notice' }
  | { kind: 'class-over' }
  | { kind: 'upcoming'; noticeArrival: string | null }

// El orden importa: una entrada registrada gana a todo. Con la clase terminada ya no cuenta el aviso.
// Antes del final, un aviso de ausencia gana a la hora.
export function homeStateFor(
  now: Date,
  history: ClassEntry[],
  notices: StudentNotice[]
): HomeState {
  if (!todayClass.weekdays.includes(now.getDay())) return { kind: 'no-class' }

  const todayLabel = formatDay(now)
  const entry = history.find((item) => item.label === todayLabel)
  if (entry?.arrival) return { kind: 'registered', arrival: entry.arrival }

  if (secondsUntil(now, todayClass.end) <= 0) return { kind: 'class-over' }

  // Los avisos llegan del más reciente al más antiguo: vale el último que mandó.
  const notice = notices.find((item) => item.day === todayLabel)
  if (notice?.kind === 'ausencia') return { kind: 'absent-notice' }

  return { kind: 'upcoming', noticeArrival: notice?.kind === 'retraso' ? notice.arrival : null }
}

// Si avisó de un retraso, la hora que cuenta para Tempito es la que dijo, no la de la clase.
export function moodFor(state: HomeState, now: Date): TempitoMood {
  switch (state.kind) {
    case 'registered':
      return 'happy'
    case 'upcoming':
      return moodBeforeDeadline(secondsUntil(now, state.noticeArrival ?? todayClass.start))
    default:
      return 'chill'
  }
}

// La línea gris bajo el saludo.
export function subtitleFor(state: HomeState): string {
  switch (state.kind) {
    case 'no-class':
      return 'Hoy no tienes clase'
    case 'registered':
      return `${todayClass.name} · En clase desde las ${state.arrival}`
    case 'absent-notice':
      return `${todayClass.name} · Avisaste que hoy no vienes`
    case 'class-over':
      return `${todayClass.name} · La clase de hoy ya terminó`
    case 'upcoming':
      return state.noticeArrival === null
        ? `${todayClass.name} · ${todayClass.start}`
        : `${todayClass.name} · Avisaste que llegas a las ${state.noticeArrival}`
  }
}

// Se puede registrar mientras la clase de hoy no ha terminado,
// también si avisó de que no venía y al final viene.
export function canRegister(state: HomeState): boolean {
  return state.kind === 'upcoming' || state.kind === 'absent-notice'
}
