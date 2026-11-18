import type {
  AttendanceCorrection,
  AttendanceRecord,
  CheckInCode,
  CourseStudent,
  Session
} from './contract'
import { isFixtureName, type FixtureName } from './fixtures'
import { createMockTransport, type DemoControls } from './mockTransport'

// Las operaciones del contrato API v1 que usa el panel del profesor.
// Cada una corresponde a un endpoint; el comentario dice cuál.
export type ApiClient = {
  // GET /sessions?date=YYYY-MM-DD
  listSessions: (date: string) => Promise<Session[]>
  // GET /sessions/:sessionId
  getSession: (sessionId: string) => Promise<Session>
  // GET /sessions/:sessionId/attendances
  listAttendances: (sessionId: string) => Promise<AttendanceRecord[]>
  // POST /sessions/:sessionId/open
  openSession: (sessionId: string) => Promise<Session>
  // POST /sessions/:sessionId/close
  closeSession: (sessionId: string) => Promise<Session>
  // GET /sessions/:sessionId/check-in-code
  getCheckInCode: (sessionId: string) => Promise<CheckInCode>
  // PUT /sessions/:sessionId/attendances/:studentId
  correctAttendance: (
    sessionId: string,
    studentId: string,
    correction: AttendanceCorrection
  ) => Promise<AttendanceRecord>
  // GET /courses/:courseId/students
  listCourseStudents: (courseId: string) => Promise<CourseStudent[]>
}

// El transporte se elige aquí. Hoy solo existe el mock: el HTTP llegará cuando el back
// publique los endpoints, sin tocar las pantallas.
let client: ApiClient | null = null
let demo: DemoControls | null = null

// main pasa la fixture en la dirección de la página: ?apiFixture=<nombre>.
function fixtureFromAddress(): FixtureName {
  const name = new URLSearchParams(globalThis.location?.search ?? '').get('apiFixture')
  return isFixtureName(name) ? name : 'success'
}

// Vuelve a crear el cliente desde cero. Las pruebas lo usan para empezar cada caso limpio.
export function resetApiClient(fixture: FixtureName = fixtureFromAddress()): ApiClient {
  const transport = createMockTransport(fixture)
  client = transport.client
  demo = transport.demo
  return transport.client
}

export function getApiClient(): ApiClient {
  return client ?? resetApiClient()
}

// Los controles de la demo solo existen con el mock. Con la API real, devuelve null.
export function getDemoControls(): DemoControls | null {
  getApiClient()
  return demo
}
