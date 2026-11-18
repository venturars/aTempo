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

// El error con el formato por defecto de NestJS. Sin respuesta del servidor, statusCode es 0.
export class ApiError extends Error {
  readonly statusCode: number
  readonly error: string

  constructor(statusCode: number, error: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.error = error
  }
}
