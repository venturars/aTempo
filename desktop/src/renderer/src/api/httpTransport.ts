import type { ApiClient } from './client'
import { ApiError, type ErrorCode, type FieldError, type RequestOptions } from './contract'

type ErrorBody = {
  statusCode?: number
  error?: string
  code?: string
  message?: string
  details?: FieldError[]
}

const codeForStatus: Record<number, ErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE'
}

async function errorFrom(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ErrorBody | null
  const code = (body?.code ?? codeForStatus[response.status] ?? 'INTERNAL_ERROR') as ErrorCode
  return new ApiError(
    response.status,
    body?.error ?? response.statusText,
    code,
    body?.message ?? 'Error inesperado.',
    body?.details ?? []
  )
}

function connectionError(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError(0, 'Request Cancelled', 'REQUEST_CANCELLED', 'Se canceló la petición.')
  }
  return new ApiError(0, 'Network Error', 'NETWORK_ERROR', 'No hay respuesta del servidor.')
}

function segment(value: string): string {
  return encodeURIComponent(value)
}

export function createHttpTransport(baseUrl: string): ApiClient {
  const root = baseUrl.replace(/\/+$/, '')

  async function call<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    options: RequestOptions = {},
    body?: unknown
  ): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${root}${path}`, {
        method,
        signal: options.signal,
        headers:
          body === undefined
            ? { Accept: 'application/json' }
            : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch (error) {
      throw connectionError(error)
    }
    if (!response.ok) {
      throw await errorFrom(response)
    }
    return (await response.json()) as T
  }

  return {
    listSessions: (date, options) =>
      call('GET', `/sessions?date=${encodeURIComponent(date)}`, options),
    getSession: (sessionId, options) => call('GET', `/sessions/${segment(sessionId)}`, options),
    listAttendances: (sessionId, options) =>
      call('GET', `/sessions/${segment(sessionId)}/attendances`, options),
    openSession: (sessionId, options) =>
      call('POST', `/sessions/${segment(sessionId)}/open`, options),
    closeSession: (sessionId, options) =>
      call('POST', `/sessions/${segment(sessionId)}/close`, options),
    getCheckInCode: (sessionId, options) =>
      call('GET', `/sessions/${segment(sessionId)}/check-in-code`, options),
    correctAttendance: (sessionId, studentId, correction, options) =>
      call(
        'PUT',
        `/sessions/${segment(sessionId)}/attendances/${segment(studentId)}`,
        options,
        correction
      ),
    listCourseStudents: (courseId, options) =>
      call('GET', `/courses/${segment(courseId)}/students`, options)
  }
}
