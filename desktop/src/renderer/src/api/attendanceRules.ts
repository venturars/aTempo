import { statusForArrival } from '../student/attendanceStatus'
import type { AttendanceRecord, Session } from './contract'
import { clockTime } from './isoTime'

export function arrivalStatus(
  session: Pick<Session, 'startsAt' | 'lateMinutes'>,
  time: string
): 'present' | 'late' {
  const status = statusForArrival(time, clockTime(session.startsAt), session.lateMinutes)
  return status === 'presente' ? 'present' : 'late'
}

export function checkedInByStudent(record: AttendanceRecord): boolean {
  return record.checkedInAt !== null && record.updatedBy === record.studentId
}
