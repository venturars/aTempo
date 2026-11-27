import type { TextKey } from '../lang/messages'

export type AttendanceStatus = 'presente' | 'tarde' | 'ausente'

export const statusLabelKey: Record<AttendanceStatus, TextKey> = {
  presente: 'student.status.present',
  tarde: 'student.status.late',
  ausente: 'student.status.absent'
}

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function statusForArrival(
  arrival: string,
  start: string,
  lateMinutes: number
): 'presente' | 'tarde' {
  return minutesOfDay(arrival) <= minutesOfDay(start) + lateMinutes ? 'presente' : 'tarde'
}
