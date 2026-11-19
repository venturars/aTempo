import {
  ApiError,
  isConnectionError,
  type AttendanceCorrection,
  type AttendanceRecord,
  type CheckInCode,
  type CourseStudent,
  type RequestOptions,
  type Session
} from './contract'
import { isFixtureName, type FixtureName } from './fixtures'
import { createMockTransport, type DemoControls } from './mockTransport'

// Las operaciones del contrato API v1 que usa el panel del profesor.
// Cada una corresponde a un endpoint; el comentario dice cuál.
export type ApiClient = {
  // GET /sessions?date=YYYY-MM-DD
  listSessions: (date: string, options?: RequestOptions) => Promise<Session[]>
  // GET /sessions/:sessionId
  getSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  // GET /sessions/:sessionId/attendances
  listAttendances: (sessionId: string, options?: RequestOptions) => Promise<AttendanceRecord[]>
  // POST /sessions/:sessionId/open
  openSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  // POST /sessions/:sessionId/close
  closeSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  // GET /sessions/:sessionId/check-in-code
  getCheckInCode: (sessionId: string, options?: RequestOptions) => Promise<CheckInCode>
  // PUT /sessions/:sessionId/attendances/:studentId
  correctAttendance: (
    sessionId: string,
    studentId: string,
    correction: AttendanceCorrection,
    options?: RequestOptions
  ) => Promise<AttendanceRecord>
  // GET /courses/:courseId/students
  listCourseStudents: (courseId: string, options?: RequestOptions) => Promise<CourseStudent[]>
}

// Sin respuesta en 10 segundos, la petición falla con NETWORK_TIMEOUT.
export const requestTimeout = 10_000

function cancelled(): ApiError {
  return new ApiError(0, 'Request Cancelled', 'REQUEST_CANCELLED', 'Se canceló la petición.')
}

function timedOut(): ApiError {
  return new ApiError(0, 'Network Timeout', 'NETWORK_TIMEOUT', 'El servidor no ha respondido.')
}

// Espera la respuesta, hasta el tiempo máximo y mientras nadie cancele.
function send<T>(request: () => Promise<T>, options: RequestOptions = {}): Promise<T> {
  const { signal } = options
  if (signal?.aborted) {
    return Promise.reject(cancelled())
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => finish(() => reject(timedOut())), requestTimeout)
    const onAbort = (): void => finish(() => reject(cancelled()))
    signal?.addEventListener('abort', onAbort)

    function finish(settle: () => void): void {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      settle()
    }

    request().then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error))
    )
  })
}

// Una lectura que falla por la conexión se repite una vez. Una cancelación no se repite.
async function read<T>(request: () => Promise<T>, options: RequestOptions = {}): Promise<T> {
  try {
    return await send(request, options)
  } catch (error) {
    const retry = isConnectionError(error) && (error as ApiError).code !== 'REQUEST_CANCELLED'
    if (!retry) {
      throw error
    }
    return send(request, options)
  }
}

// Aplica a cualquier transporte las reglas de conexión del contrato.
// Las escrituras nunca se repiten a ciegas: quien llama vuelve a leer para saber si se aplicaron.
export function withRequestRules(transport: ApiClient): ApiClient {
  return {
    listSessions: (date, options) => read(() => transport.listSessions(date, options), options),
    getSession: (sessionId, options) =>
      read(() => transport.getSession(sessionId, options), options),
    listAttendances: (sessionId, options) =>
      read(() => transport.listAttendances(sessionId, options), options),
    openSession: (sessionId, options) =>
      send(() => transport.openSession(sessionId, options), options),
    closeSession: (sessionId, options) =>
      send(() => transport.closeSession(sessionId, options), options),
    getCheckInCode: (sessionId, options) =>
      read(() => transport.getCheckInCode(sessionId, options), options),
    correctAttendance: (sessionId, studentId, correction, options) =>
      send(() => transport.correctAttendance(sessionId, studentId, correction, options), options),
    listCourseStudents: (courseId, options) =>
      read(() => transport.listCourseStudents(courseId, options), options)
  }
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
  client = withRequestRules(transport.client)
  demo = transport.demo
  return client
}

export function getApiClient(): ApiClient {
  return client ?? resetApiClient()
}

// Los controles de la demo solo existen con el mock. Con la API real, devuelve null.
export function getDemoControls(): DemoControls | null {
  getApiClient()
  return demo
}
