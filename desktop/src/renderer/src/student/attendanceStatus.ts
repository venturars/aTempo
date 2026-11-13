export type AttendanceStatus = 'presente' | 'tarde' | 'ausente'

export const statusLabel: Record<AttendanceStatus, string> = {
  presente: 'Presente',
  tarde: 'Tarde',
  ausente: 'Ausente'
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
