// Tipos del contrato API v1 (issue #90). Los valores van en inglés, como en la API.
// Las horas son ISO 8601 con zona horaria, por ejemplo 2026-11-11T09:04:00+01:00.

export type SessionState = 'scheduled' | 'open' | 'closed' | 'cancelled'

export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent'

// Las marcas que un profesor puede poner. `pending` solo lo pone el servidor.
export type CorrectedStatus = 'present' | 'late' | 'absent'

export type Session = {
  id: string
  courseId: string
  courseName: string
  startsAt: string
  endsAt: string
  room: string
  state: SessionState
  lateMinutes: number
}

export type AttendanceRecord = {
  studentId: string
  name: string
  status: AttendanceStatus
  checkedInAt: string | null
  updatedBy: string | null
  updatedAt: string | null
  reason: string | null
}

export type CourseStudent = {
  studentId: string
  name: string
  email: string
}

export type CheckInCode = {
  code: string
  expiresAt: string
}

export type AttendanceCorrection = {
  status: CorrectedStatus
  reason: string
  checkedInAt?: string
}

// Los `code` del catálogo de errores del contrato. El front elige su mensaje por `code`.
export type ServerErrorCode =
  | 'VALIDATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'SESSION_NOT_FOUND'
  | 'COURSE_NOT_FOUND'
  | 'STUDENT_NOT_ENROLLED'
  | 'EMAIL_TAKEN'
  | 'SESSION_NOT_SCHEDULED'
  | 'SESSION_NOT_TODAY'
  | 'SESSION_NOT_OPEN'
  | 'SESSION_NOT_EDITABLE'
  | 'CHECK_IN_CODE_INVALID'
  | 'CHECK_IN_CODE_EXPIRED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

// Los errores de conexión los pone el cliente, porque no llega respuesta.
export type ConnectionErrorCode = 'NETWORK_TIMEOUT' | 'NETWORK_ERROR' | 'REQUEST_CANCELLED'

export type ErrorCode = ServerErrorCode | ConnectionErrorCode

// Un campo que no pasa la validación. Solo llega con VALIDATION_FAILED.
export type FieldError = {
  field: string
  message: string
}

// El cuerpo de error del contrato: los campos de NestJS más `code` y `details`.
// Un error de conexión tiene statusCode 0.
export class ApiError extends Error {
  readonly statusCode: number
  readonly error: string
  readonly code: ErrorCode
  readonly details: FieldError[]

  constructor(
    statusCode: number,
    error: string,
    code: ErrorCode,
    message: string,
    details: FieldError[] = []
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.error = error
    this.code = code
    this.details = details
  }
}

export function isConnectionError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 0
}

// Las peticiones aceptan una señal para cancelarlas.
export type RequestOptions = {
  signal?: AbortSignal
}
