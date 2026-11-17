export type AttendanceStatus = 'presente' | 'tarde' | 'ausente'

export const statusLabel: Record<AttendanceStatus, string> = {
  presente: 'Presente',
  tarde: 'Tarde',
  ausente: 'Ausente'
}

const statusClass: Record<AttendanceStatus, string> = {
  presente: 'status status-success',
  tarde: 'status status-warning',
  ausente: 'status status-error'
}

const statusBadge: Record<AttendanceStatus, string> = {
  presente: 'badge badge-sm badge-soft badge-success',
  tarde: 'badge badge-sm badge-soft badge-warning',
  ausente: 'badge badge-sm badge-soft badge-error'
}

export function statusBadgeClass(status: AttendanceStatus): string {
  return statusBadge[status]
}

export function statusMarkClass(status: AttendanceStatus): string {
  return statusClass[status]
}

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
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
