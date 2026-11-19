import { course, rosterNames, todayDate, todayEntry } from '../panel/roster'
import type { CourseStudent, Session } from './contract'
import { isoAt } from './isoTime'

// Cada fixture prepara el mock para un caso. Se elige al arrancar con --api-fixture=<nombre>.
// - success: la clase de hoy, programada, con quince alumnos.
// - empty: el profesor no tiene clases hoy.
// - denied: todas las peticiones responden 403 FORBIDDEN.
// - unauthenticated: todas las peticiones responden 401 UNAUTHENTICATED, como con el token caducado.
// - network: las lecturas funcionan y las escrituras fallan sin respuesta del servidor.
// - timeout: las lecturas funcionan y las escrituras nunca responden.
// - server-error: las lecturas funcionan y las escrituras responden 500 INTERNAL_ERROR.
// - conflict: al abrir, la sesión ya estaba abierta desde otro sitio y responde 409.
// - expired-code: el primer código del QR llega ya caducado.
export const fixtureNames = [
  'success',
  'empty',
  'denied',
  'unauthenticated',
  'network',
  'timeout',
  'server-error',
  'conflict',
  'expired-code'
] as const

export type FixtureName = (typeof fixtureNames)[number]

export function isFixtureName(value: string | null): value is FixtureName {
  return fixtureNames.some((name) => name === value)
}

export const sampleTeacherId = 'teacher-ventura-rodriguez'

// El mock vive en el día de los datos de ejemplo, no en el día real.
export const sampleToday = todayDate

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

export function studentIdOf(name: string): string {
  return `student-${slugOf(name)}`
}

export function sampleSession(): Session {
  const endsAt = course.time.split('–')[1] ?? '18:00'
  return {
    id: `session-${todayDate}`,
    courseId: 'course-ai-engineering',
    courseName: course.name,
    startsAt: isoAt(todayDate, course.startsAt),
    endsAt: isoAt(todayDate, endsAt),
    room: course.room,
    state: 'scheduled',
    lateMinutes: 10
  }
}

export function sampleStudents(): CourseStudent[] {
  return rosterNames.map((name) => ({
    studentId: studentIdOf(name),
    name,
    email: `${slugOf(name)}@atempo.test`
  }))
}

// La hora a la que llega cada alumno cuando se simula su llegada. Quien no tiene hora no llega.
export function sampleArrivals(): Record<string, string> {
  const arrivals: Record<string, string> = {}
  rosterNames.forEach((name, index) => {
    const time = todayEntry[index]
    if (time !== undefined && /^\d\d:\d\d$/.test(time)) {
      arrivals[studentIdOf(name)] = time
    }
  })
  return arrivals
}
