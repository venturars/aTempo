import type { RouterRequest, RouterResponse } from '../../../preload/router'
import type { ApiClient } from './client'
import { ApiError, type ErrorCode, type FieldError } from './contract'

export type SendToRouter = (request: RouterRequest) => Promise<RouterResponse>

type ErrorBody = {
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

function errorFrom(status: number, statusText: string, body: unknown): ApiError {
  const error = (typeof body === 'object' && body !== null ? body : {}) as ErrorBody
  const code = (error.code ?? codeForStatus[status] ?? 'INTERNAL_ERROR') as ErrorCode
  return new ApiError(
    status,
    error.error ?? statusText,
    code,
    error.message ?? 'Error inesperado.',
    error.details ?? []
  )
}

function noResponse(reason: 'timeout' | 'network'): ApiError {
  return reason === 'timeout'
    ? new ApiError(0, 'Network Timeout', 'NETWORK_TIMEOUT', 'El servidor no ha respondido.')
    : new ApiError(0, 'Network Error', 'NETWORK_ERROR', 'No hay respuesta del servidor.')
}

function segment(value: string): string {
  return encodeURIComponent(value)
}

export function createHttpTransport(send: SendToRouter): ApiClient {
  async function call<T>(
    method: RouterRequest['method'],
    path: string,
    body?: unknown
  ): Promise<T> {
    let response: RouterResponse
    try {
      response = await send(body === undefined ? { method, path } : { method, path, body })
    } catch {
      throw noResponse('network')
    }
    if (response.kind === 'no-response') {
      throw noResponse(response.reason)
    }
    if (response.status < 200 || response.status >= 300) {
      throw errorFrom(response.status, response.statusText, response.body)
    }
    return response.body as T
  }

  return {
    listSessions: (date) => call('GET', `/sessions?date=${encodeURIComponent(date)}`),
    getSession: (sessionId) => call('GET', `/sessions/${segment(sessionId)}`),
    listAttendances: (sessionId) => call('GET', `/sessions/${segment(sessionId)}/attendances`),
    openSession: (sessionId) => call('POST', `/sessions/${segment(sessionId)}/open`),
    closeSession: (sessionId) => call('POST', `/sessions/${segment(sessionId)}/close`),
    getCheckInCode: (sessionId) => call('GET', `/sessions/${segment(sessionId)}/check-in-code`),
    correctAttendance: (sessionId, studentId, correction) =>
      call('PUT', `/sessions/${segment(sessionId)}/attendances/${segment(studentId)}`, correction),
    listCourseStudents: (courseId) => call('GET', `/courses/${segment(courseId)}/students`)
  }
}
