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
import { createHttpTransport, type SendToRouter } from './httpTransport'
import { localDay } from './isoTime'
import { createMockTransport, type DemoControls } from './mockTransport'

export type ApiClient = {
  listSessions: (date: string, options?: RequestOptions) => Promise<Session[]>
  getSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  listAttendances: (sessionId: string, options?: RequestOptions) => Promise<AttendanceRecord[]>
  openSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  closeSession: (sessionId: string, options?: RequestOptions) => Promise<Session>
  getCheckInCode: (sessionId: string, options?: RequestOptions) => Promise<CheckInCode>
  correctAttendance: (
    sessionId: string,
    studentId: string,
    correction: AttendanceCorrection,
    options?: RequestOptions
  ) => Promise<AttendanceRecord>
  listCourseStudents: (courseId: string, options?: RequestOptions) => Promise<CourseStudent[]>
}

export const requestTimeout = 10_000

function cancelled(): ApiError {
  return new ApiError(0, 'Request Cancelled', 'REQUEST_CANCELLED', 'Se canceló la petición.')
}

function timedOut(): ApiError {
  return new ApiError(0, 'Network Timeout', 'NETWORK_TIMEOUT', 'El servidor no ha respondido.')
}

function send<T>(
  request: (options: RequestOptions) => Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  const callerSignal = options.signal
  if (callerSignal?.aborted) {
    return Promise.reject(cancelled())
  }
  const controller = new AbortController()
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => stop(timedOut()), requestTimeout)
    const onCallerAbort = (): void => stop(cancelled())
    callerSignal?.addEventListener('abort', onCallerAbort)

    function cleanUp(): void {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', onCallerAbort)
    }

    function stop(error: ApiError): void {
      cleanUp()
      controller.abort()
      reject(error)
    }

    request({ signal: controller.signal }).then(
      (value) => {
        cleanUp()
        resolve(value)
      },
      (error: unknown) => {
        cleanUp()
        reject(error)
      }
    )
  })
}

function shouldRetry(error: unknown): boolean {
  return isConnectionError(error) && (error as ApiError).code !== 'REQUEST_CANCELLED'
}

async function read<T>(
  request: (options: RequestOptions) => Promise<T>,
  options: RequestOptions = {}
): Promise<T> {
  try {
    return await send(request, options)
  } catch (error) {
    if (!shouldRetry(error)) {
      throw error
    }
    return send(request, options)
  }
}

export function withRequestRules(transport: ApiClient): ApiClient {
  return {
    listSessions: (date, options) => read((inner) => transport.listSessions(date, inner), options),
    getSession: (sessionId, options) =>
      read((inner) => transport.getSession(sessionId, inner), options),
    listAttendances: (sessionId, options) =>
      read((inner) => transport.listAttendances(sessionId, inner), options),
    openSession: (sessionId, options) =>
      send((inner) => transport.openSession(sessionId, inner), options),
    closeSession: (sessionId, options) =>
      send((inner) => transport.closeSession(sessionId, inner), options),
    getCheckInCode: (sessionId, options) =>
      read((inner) => transport.getCheckInCode(sessionId, inner), options),
    correctAttendance: (sessionId, studentId, correction, options) =>
      send(
        (inner) => transport.correctAttendance(sessionId, studentId, correction, inner),
        options
      ),
    listCourseStudents: (courseId, options) =>
      read((inner) => transport.listCourseStudents(courseId, inner), options)
  }
}

let client: ApiClient | null = null
let demo: DemoControls | null = null

function addressParam(name: string): string | null {
  return new URLSearchParams(globalThis.location?.search ?? '').get(name)
}

function fixtureFromAddress(): FixtureName {
  const name = addressParam('apiFixture')
  return isFixtureName(name) ? name : 'success'
}

function routerFromAddress(): SendToRouter | null {
  if (addressParam('apiTransport') !== 'http') return null
  return globalThis.window?.api?.router?.request ?? null
}

export function resetApiClient(
  fixture: FixtureName = fixtureFromAddress(),
  sendToRouter: SendToRouter | null = routerFromAddress()
): ApiClient {
  if (sendToRouter !== null) {
    client = withRequestRules(createHttpTransport(sendToRouter))
    demo = null
    return client
  }
  const transport = createMockTransport(fixture, localDay())
  client = withRequestRules(transport.client)
  demo = transport.demo
  return client
}

export function getApiClient(): ApiClient {
  return client ?? resetApiClient()
}

export function getDemoControls(): DemoControls | null {
  getApiClient()
  return demo
}
