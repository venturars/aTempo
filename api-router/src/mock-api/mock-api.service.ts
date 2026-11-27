import { Injectable } from '@nestjs/common'
import {
  conflict,
  notFound,
  validationFailed,
} from '../contract/contract-exception'
import type {
  AttendanceCorrectionDto,
  AttendanceRecordDto,
  CheckInCodeDto,
  CourseStudentDto,
  SessionDto,
} from './dto'
import {
  dayOf,
  sampleDay,
  sampleSession,
  sampleStudents,
  sampleTeacherId,
} from './sample-data'

const codeLifetime = 30_000

function pendingRecord(student: CourseStudentDto): AttendanceRecordDto {
  return {
    studentId: student.studentId,
    name: student.name,
    status: 'pending',
    checkedInAt: null,
    updatedBy: null,
    updatedAt: null,
    reason: null,
  }
}

@Injectable()
export class MockApiService {
  private readonly sessions: SessionDto[] = []
  private readonly students = sampleStudents()
  private readonly records: Record<
    string,
    Record<string, AttendanceRecordDto>
  > = {}
  private readonly openedAt: Record<string, number> = {}

  private today(): string {
    const day = sampleDay()
    if (!this.sessions.some((session) => dayOf(session.startsAt) === day)) {
      this.sessions.push(sampleSession(day))
    }
    return day
  }

  private findSession(sessionId: string): SessionDto {
    this.today()
    const session = this.sessions.find((item) => item.id === sessionId)
    if (session === undefined) {
      throw notFound('SESSION_NOT_FOUND', 'La sesión no existe.')
    }
    return session
  }

  private findStudent(studentId: string): CourseStudentDto {
    const student = this.students.find((item) => item.studentId === studentId)
    if (student === undefined) {
      throw notFound('STUDENT_NOT_ENROLLED', 'El alumno no está matriculado.')
    }
    return student
  }

  private recordsOf(sessionId: string): Record<string, AttendanceRecordDto> {
    return this.records[sessionId] ?? {}
  }

  listSessions(date: string): SessionDto[] {
    this.today()
    return this.sessions
      .filter((session) => dayOf(session.startsAt) === date)
      .map((session) => ({ ...session }))
  }

  getSession(sessionId: string): SessionDto {
    return { ...this.findSession(sessionId) }
  }

  listAttendances(sessionId: string): AttendanceRecordDto[] {
    this.findSession(sessionId)
    const records = this.recordsOf(sessionId)
    return this.students.map((student) => ({
      ...(records[student.studentId] ?? pendingRecord(student)),
    }))
  }

  openSession(sessionId: string): SessionDto {
    const session = this.findSession(sessionId)
    if (session.state !== 'scheduled') {
      throw conflict('SESSION_NOT_SCHEDULED', 'La sesión no está programada.')
    }
    if (dayOf(session.startsAt) !== this.today()) {
      throw conflict(
        'SESSION_NOT_TODAY',
        'La sesión solo se puede abrir el día de la clase.',
      )
    }
    session.state = 'open'
    this.openedAt[session.id] = Date.now()
    this.records[session.id] = Object.fromEntries(
      this.students.map((student) => [
        student.studentId,
        pendingRecord(student),
      ]),
    )
    return { ...session }
  }

  closeSession(sessionId: string): SessionDto {
    const session = this.findSession(sessionId)
    if (session.state !== 'open') {
      throw conflict('SESSION_NOT_OPEN', 'La sesión no está abierta.')
    }
    const closedAt = new Date().toISOString()
    for (const record of Object.values(this.recordsOf(sessionId))) {
      if (record.status === 'pending') {
        record.status = 'absent'
        record.updatedAt = closedAt
      }
    }
    session.state = 'closed'
    delete this.openedAt[sessionId]
    return { ...session }
  }

  checkInCode(sessionId: string): CheckInCodeDto {
    const session = this.findSession(sessionId)
    if (session.state !== 'open') {
      throw conflict('SESSION_NOT_OPEN', 'La sesión no está abierta.')
    }
    const openedAt = this.openedAt[sessionId] ?? Date.now()
    const period = Math.floor(Math.max(0, Date.now() - openedAt) / codeLifetime)
    const code = String(
      100000 + ((Math.floor(openedAt / 1000) + period * 7919) % 900000),
    )
    const expiresAt = new Date(
      openedAt + (period + 1) * codeLifetime,
    ).toISOString()
    return { code, expiresAt }
  }

  correctAttendance(
    sessionId: string,
    studentId: string,
    correction: AttendanceCorrectionDto,
  ): AttendanceRecordDto {
    if (
      correction.status === 'absent' &&
      correction.checkedInAt !== undefined
    ) {
      throw validationFailed([
        {
          field: 'checkedInAt',
          message: 'Un alumno ausente no tiene hora de entrada.',
        },
      ])
    }
    const session = this.findSession(sessionId)
    const student = this.findStudent(studentId)
    if (session.state !== 'open' && session.state !== 'closed') {
      throw conflict(
        'SESSION_NOT_EDITABLE',
        'La sesión no está abierta ni cerrada.',
      )
    }
    const records = (this.records[sessionId] ??= {})
    const record = (records[studentId] ??= pendingRecord(student))
    record.status = correction.status
    if (correction.status === 'absent') {
      record.checkedInAt = null
    } else if (correction.checkedInAt !== undefined) {
      record.checkedInAt = correction.checkedInAt
    }
    record.updatedBy = sampleTeacherId
    record.updatedAt = new Date().toISOString()
    record.reason = correction.reason?.trim() || null
    return { ...record }
  }

  listCourseStudents(courseId: string): CourseStudentDto[] {
    this.today()
    if (!this.sessions.some((session) => session.courseId === courseId)) {
      throw notFound('COURSE_NOT_FOUND', 'El curso no existe.')
    }
    return this.students.map((student) => ({ ...student }))
  }
}
