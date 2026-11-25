import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsISO8601, IsOptional, IsString, Matches } from 'class-validator'

export const sessionStates = ['scheduled', 'open', 'closed', 'cancelled']
export const attendanceStatuses = ['pending', 'present', 'late', 'absent']
export const correctedStatuses = ['present', 'late', 'absent']

export type SessionState = 'scheduled' | 'open' | 'closed' | 'cancelled'
export type AttendanceStatus = 'pending' | 'present' | 'late' | 'absent'
export type CorrectedStatus = 'present' | 'late' | 'absent'

export class SessionDto {
  @ApiProperty({ example: 'session-2026-11-23' })
  id!: string

  @ApiProperty({ example: 'course-ai-engineering' })
  courseId!: string

  @ApiProperty({ example: 'AI Engineering' })
  courseName!: string

  @ApiProperty({ example: '2026-11-23T09:00:00+01:00' })
  startsAt!: string

  @ApiProperty({ example: '2026-11-23T18:00:00+01:00' })
  endsAt!: string

  @ApiProperty({ example: 'Aula 3' })
  room!: string

  @ApiProperty({ enum: sessionStates })
  state!: SessionState

  @ApiProperty({ example: 10 })
  lateMinutes!: number
}

export class AttendanceRecordDto {
  @ApiProperty({ example: 'student-victor-chang' })
  studentId!: string

  @ApiProperty({ example: 'Victor Chang' })
  name!: string

  @ApiProperty({ enum: attendanceStatuses })
  status!: AttendanceStatus

  @ApiProperty({ type: String, nullable: true })
  checkedInAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  updatedBy!: string | null

  @ApiProperty({ type: String, nullable: true })
  updatedAt!: string | null

  @ApiProperty({ type: String, nullable: true })
  reason!: string | null
}

export class CourseStudentDto {
  @ApiProperty({ example: 'student-victor-chang' })
  studentId!: string

  @ApiProperty({ example: 'Victor Chang' })
  name!: string

  @ApiProperty({ example: 'victor-chang@atempo.test' })
  email!: string
}

export class CheckInCodeDto {
  @ApiProperty({ example: '482913' })
  code!: string

  @ApiProperty({ example: '2026-11-23T08:00:30.000Z' })
  expiresAt!: string
}

export class SessionsQueryDto {
  @ApiProperty({ example: '2026-11-23' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha tiene que ser AAAA-MM-DD.',
  })
  date!: string
}

export class AttendanceCorrectionDto {
  @ApiProperty({ enum: correctedStatuses })
  @IsIn(correctedStatuses, {
    message: 'La marca tiene que ser present, late o absent.',
  })
  status!: CorrectedStatus

  // Opcional: sin motivo, o con solo espacios, el registro guarda reason: null.
  @ApiPropertyOptional({ example: 'Llegó con el autobús de las 09:00.' })
  @IsOptional()
  @IsString({ message: 'El motivo tiene que ser texto.' })
  reason?: string

  @ApiPropertyOptional({ example: '2026-11-23T09:20:00+01:00' })
  @IsOptional()
  @IsISO8601({}, { message: 'La hora de entrada tiene que ser ISO 8601.' })
  checkedInAt?: string
}
