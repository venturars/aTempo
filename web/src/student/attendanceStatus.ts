import type { TextKey } from '../lang/messages'
import { minutesOfDay } from './studentDate'

export type AttendanceStatus = 'presente' | 'tarde' | 'ausente'

// La clave del texto de cada estado. El componente la traduce con t().
export const statusLabelKey: Record<AttendanceStatus, TextKey> = {
  presente: 'attendance.status.present',
  tarde: 'attendance.status.late',
  ausente: 'attendance.status.absent'
}

const statusBadge: Record<AttendanceStatus, string> = {
  presente: 'badge badge-sm badge-soft badge-success',
  tarde: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error'
}

export function statusBadgeClass(status: AttendanceStatus): string {
  return statusBadge[status]
}

export function statusForArrival(
  arrival: string,
  start: string,
  marginMinutes: number
): 'presente' | 'tarde' {
  return minutesOfDay(arrival) <= minutesOfDay(start) + marginMinutes ? 'presente' : 'tarde'
}

export function clockTime(now = new Date()): string {
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
