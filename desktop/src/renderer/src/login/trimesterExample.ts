import { formatDate } from '../lang/format'
import type { TextKey } from '../lang/messages'
import { classDate } from '../student/classDate'

export type AttendanceMark = 'presente' | 'retraso' | 'ausencia'

// date es un día real de la semana de ejemplo, «2026-11-09». Su nombre sale de la fecha.
export type TrimesterDay = {
  date: string
  marks: AttendanceMark[]
}

// La semana de ejemplo, de lunes a viernes.
const exampleWeekDates = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']

const markClasses: Record<AttendanceMark, string> = {
  presente: 'status status-success',
  retraso: 'status status-warning',
  ausencia: 'status status-error'
}

const markLabelKeys: Record<AttendanceMark, TextKey> = {
  presente: 'login.marks.present',
  retraso: 'login.marks.late',
  ausencia: 'login.marks.absence'
}

function sessionMarks(): AttendanceMark[] {
  const marks: AttendanceMark[] = []

  for (let index = 0; index < 12; index += 1) {
    marks.push('presente')
  }

  marks.push('retraso', 'ausencia')
  return marks
}

export const trimesterDays: TrimesterDay[] = exampleWeekDates.map((date) => ({
  date,
  marks: sessionMarks()
}))

export function markClass(mark: AttendanceMark): string {
  return markClasses[mark]
}

// La clave del texto de la marca. El componente la traduce con t().
export function markLabelKey(mark: AttendanceMark): TextKey {
  return markLabelKeys[mark]
}

// El nombre del día: «lunes». Se llama al pintar, para que siga el idioma elegido.
export function dayName(day: TrimesterDay): string {
  return formatDate(classDate(day.date), { weekday: 'long' })
}

// La inicial del día: «L», «M», «X».
export function dayInitial(day: TrimesterDay): string {
  return formatDate(classDate(day.date), { weekday: 'narrow' })
}
