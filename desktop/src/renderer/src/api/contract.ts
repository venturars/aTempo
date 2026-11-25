export type SessionState = 'scheduled' | 'open' | 'closed' | 'cancelled'

export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent'

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
  // Opcional: sin motivo, o con null, el registro guarda reason: null.
  reason?: string | null
  checkedInAt?: string
}

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

export type ConnectionErrorCode = 'NETWORK_TIMEOUT' | 'NETWORK_ERROR' | 'REQUEST_CANCELLED'

export type ErrorCode = ServerErrorCode | ConnectionErrorCode

export type FieldError = {
  field: string
  message: string
}

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

export type RequestOptions = {
  signal?: AbortSignal
}
