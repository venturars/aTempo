import { statusForArrival } from '../student/attendanceStatus'
import type { ApiClient } from './client'
import {
  ApiError,
  type AttendanceCorrection,
  type AttendanceRecord,
  type CheckInCode,
  type CourseStudent,
  type Session
} from './contract'
import {
  sampleArrivals,
  sampleSession,
  sampleStudents,
  sampleTeacherId,
  sampleToday,
  type FixtureName
} from './fixtures'
import { clockTime, dayOf, isoAt } from './isoTime'

// Lo que el mock ofrece para la demo y no es parte del contrato.
export type DemoControls = {
  // Si queda algún alumno pendiente que pueda llegar.
  hasNextArrival: (sessionId: string) => boolean
  // Hace llegar al siguiente alumno pendiente, a su hora de ejemplo.
  simulateNextArrival: (sessionId: string) => Promise<AttendanceRecord | null>
  // Registra la llegada de un alumno a una hora. Aplica las reglas de POST /check-ins.
  arrive: (sessionId: string, studentId: string, time: string) => Promise<AttendanceRecord>
  // Vuelve a abrir una sesión cerrada. El contrato v1 todavía no lo incluye.
  reopenSession: (sessionId: string) => Promise<Session>
}

export type MockTransport = {
  client: ApiClient
  demo: DemoControls
}

// El código del QR dura 30 segundos.
const codeLifetime = 30_000

type MockState = {
  sessions: Session[]
  students: CourseStudent[]
  // Registros de asistencia por sesión y por alumno. Se crean al abrir la sesión.
  records: Record<string, Record<string, AttendanceRecord>>
  // Cuándo se abrió cada sesión, en milisegundos. El código del QR cuenta desde ahí.
  openedAt: Record<string, number>
  arrivals: Record<string, string>
  codesServed: number
}

function notFound(what: string): ApiError {
  return new ApiError(404, 'Not Found', `${what} no existe.`)
}

function conflict(message: string): ApiError {
  return new ApiError(409, 'Conflict', message)
}

function badRequest(message: string): ApiError {
  return new ApiError(400, 'Bad Request', message)
}

function forbidden(): ApiError {
  return new ApiError(403, 'Forbidden', 'No tienes acceso a este recurso.')
}

function noResponse(): ApiError {
  return new ApiError(0, 'Network Error', 'No hay respuesta del servidor.')
}

function pendingRecord(student: CourseStudent): AttendanceRecord {
  return {
    studentId: student.studentId,
    name: student.name,
    status: 'pending',
    checkedInAt: null,
    updatedBy: null,
    updatedAt: null,
    reason: null
  }
}

export function createMockTransport(fixture: FixtureName): MockTransport {
  const state: MockState = {
    sessions: fixture === 'empty' ? [] : [sampleSession()],
    students: sampleStudents(),
    records: {},
    openedAt: {},
    arrivals: sampleArrivals(),
    codesServed: 0
  }

  // Con la fixture denied, nada pasa del control de acceso.
  function checkAccess(): void {
    if (fixture === 'denied') {
      throw forbidden()
    }
  }

  // Con la fixture network, las escrituras no llegan al servidor.
  function checkWrite(): void {
    checkAccess()
    if (fixture === 'network') {
      throw noResponse()
    }
  }

  function findSession(sessionId: string): Session {
    const session = state.sessions.find((item) => item.id === sessionId)
    if (session === undefined) {
      throw notFound('La sesión')
    }
    return session
  }

  function findStudent(studentId: string): CourseStudent {
    const student = state.students.find((item) => item.studentId === studentId)
    if (student === undefined) {
      throw notFound('El alumno')
    }
    return student
  }

  function recordsOf(sessionId: string): Record<string, AttendanceRecord> {
    return state.records[sessionId] ?? {}
  }

  // Los registros en el orden de la lista de la clase. Antes de abrir, todos están pendientes.
  function attendancesOf(sessionId: string): AttendanceRecord[] {
    const records = recordsOf(sessionId)
    return state.students.map((student) => ({
      ...(records[student.studentId] ?? pendingRecord(student))
    }))
  }

  function startSession(session: Session): void {
    session.state = 'open'
    state.openedAt[session.id] = Date.now()
    state.records[session.id] = Object.fromEntries(
      state.students.map((student) => [student.studentId, pendingRecord(student)])
    )
  }

  // El código cambia cada 30 segundos desde que se abrió la sesión.
  function currentCode(sessionId: string): CheckInCode {
    const openedAt = state.openedAt[sessionId] ?? Date.now()
    const period = Math.floor(Math.max(0, Date.now() - openedAt) / codeLifetime)
    // Seis cifras que cambian en cada periodo.
    const code = String(100000 + ((Math.floor(openedAt / 1000) + period * 7919) % 900000))
    const expiresAt = new Date(openedAt + (period + 1) * codeLifetime).toISOString()
    return { code, expiresAt }
  }

  function nextArrival(sessionId: string): string | null {
    const records = recordsOf(sessionId)
    const next = state.students.find((student) => {
      const record = records[student.studentId]
      return (
        record !== undefined &&
        record.status === 'pending' &&
        state.arrivals[student.studentId] !== undefined
      )
    })
    return next?.studentId ?? null
  }

  // Las reglas de POST /check-ins: sesión abierta, alumno matriculado y la hora decide la marca.
  // Una llegada repetida devuelve el registro que ya había, sin cambiarlo.
  async function arrive(
    sessionId: string,
    studentId: string,
    time: string
  ): Promise<AttendanceRecord> {
    checkAccess()
    const session = findSession(sessionId)
    if (session.state !== 'open') {
      throw badRequest('El código no es válido o ha caducado.')
    }
    findStudent(studentId)
    const record = recordsOf(sessionId)[studentId]
    if (record === undefined) {
      throw new ApiError(403, 'Forbidden', 'El alumno no está matriculado.')
    }
    if (record.status !== 'pending') {
      return { ...record }
    }
    const status = statusForArrival(time, clockTime(session.startsAt), session.lateMinutes)
    const checkedInAt = isoAt(dayOf(session.startsAt), time)
    record.status = status === 'presente' ? 'present' : 'late'
    record.checkedInAt = checkedInAt
    record.updatedBy = studentId
    record.updatedAt = checkedInAt
    return { ...record }
  }

  const client: ApiClient = {
    listSessions: async (date) => {
      checkAccess()
      return state.sessions
        .filter((session) => dayOf(session.startsAt) === date)
        .map((session) => ({ ...session }))
    },

    getSession: async (sessionId) => {
      checkAccess()
      return { ...findSession(sessionId) }
    },

    listAttendances: async (sessionId) => {
      checkAccess()
      findSession(sessionId)
      return attendancesOf(sessionId)
    },

    openSession: async (sessionId) => {
      checkWrite()
      const session = findSession(sessionId)
      if (fixture === 'conflict' && session.state === 'scheduled') {
        // Otra persona la abrió antes: el servidor ya la tiene abierta.
        startSession(session)
        throw conflict('La sesión ya está abierta.')
      }
      if (session.state !== 'scheduled') {
        throw conflict('La sesión no está programada.')
      }
      if (dayOf(session.startsAt) !== sampleToday) {
        throw conflict('La sesión solo se puede abrir el día de la clase.')
      }
      startSession(session)
      return { ...session }
    },

    closeSession: async (sessionId) => {
      checkWrite()
      const session = findSession(sessionId)
      if (session.state !== 'open') {
        throw conflict('La sesión no está abierta.')
      }
      const closedAt = new Date().toISOString()
      for (const record of Object.values(recordsOf(sessionId))) {
        if (record.status === 'pending') {
          record.status = 'absent'
          record.updatedAt = closedAt
        }
      }
      session.state = 'closed'
      delete state.openedAt[sessionId]
      return { ...session }
    },

    getCheckInCode: async (sessionId) => {
      checkAccess()
      const session = findSession(sessionId)
      if (session.state !== 'open') {
        throw conflict('La sesión no está abierta.')
      }
      state.codesServed += 1
      const code = currentCode(sessionId)
      if (fixture === 'expired-code' && state.codesServed === 1) {
        return { ...code, expiresAt: new Date(Date.now() - 1000).toISOString() }
      }
      return code
    },

    correctAttendance: async (sessionId, studentId, correction: AttendanceCorrection) => {
      checkWrite()
      const session = findSession(sessionId)
      if (session.state !== 'open' && session.state !== 'closed') {
        throw conflict('La sesión no está abierta ni cerrada.')
      }
      findStudent(studentId)
      const record = recordsOf(sessionId)[studentId]
      if (record === undefined) {
        throw notFound('El alumno')
      }
      if (correction.reason.trim() === '') {
        throw badRequest('El motivo es obligatorio.')
      }
      if (correction.status === 'absent' && correction.checkedInAt !== undefined) {
        throw badRequest('Un alumno ausente no tiene hora de entrada.')
      }
      record.status = correction.status
      if (correction.status === 'absent') {
        record.checkedInAt = null
      } else if (correction.checkedInAt !== undefined) {
        record.checkedInAt = correction.checkedInAt
      }
      record.updatedBy = sampleTeacherId
      record.updatedAt = new Date().toISOString()
      record.reason = correction.reason.trim()
      return { ...record }
    },

    listCourseStudents: async (courseId) => {
      checkAccess()
      if (!state.sessions.some((session) => session.courseId === courseId)) {
        throw notFound('El curso')
      }
      return state.students.map((student) => ({ ...student }))
    }
  }

  const demo: DemoControls = {
    hasNextArrival: (sessionId) => nextArrival(sessionId) !== null,

    simulateNextArrival: async (sessionId) => {
      const studentId = nextArrival(sessionId)
      const time = studentId === null ? undefined : state.arrivals[studentId]
      if (studentId === null || time === undefined) {
        return null
      }
      return arrive(sessionId, studentId, time)
    },

    arrive,

    reopenSession: async (sessionId) => {
      checkWrite()
      const session = findSession(sessionId)
      if (session.state !== 'closed') {
        throw conflict('La sesión no está cerrada.')
      }
      session.state = 'open'
      state.openedAt[sessionId] = Date.now()
      return { ...session }
    }
  }

  return { client, demo }
}
