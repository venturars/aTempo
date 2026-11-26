import type { AttendanceStatus } from './attendanceStatus'

export type ClassEntry = {
  label: string
  arrival: string | null
  status: AttendanceStatus
}

export type StudentAccount = {
  name: string
  email: string
  history: ClassEntry[]
  // Campos de person en PostgreSQL. La cuenta de ejemplo no los tiene.
  firstName?: string
  lastName?: string
  identificationDocument?: string
}

export type TodayClass = {
  name: string
  start: string
  end: string
  // Días con clase, como Date.getDay(): 0 es domingo, 1 es lunes.
  weekdays: number[]
  // Va dentro del QR del profesor. El código de 6 cifras sale de aquí (classCode.ts).
  id: string
}

export const exampleStudent: StudentAccount = {
  name: 'Ada López',
  email: 'ada.lopez@clase.test',
  history: [
    { label: 'Mar 10 nov', arrival: '08:57', status: 'presente' },
    { label: 'Lun 9 nov', arrival: '09:16', status: 'tarde' },
    { label: 'Vie 6 nov', arrival: null, status: 'ausente' },
    { label: 'Jue 5 nov', arrival: '09:02', status: 'presente' },
    { label: 'Mar 3 nov', arrival: '08:59', status: 'presente' },
    { label: 'Lun 2 nov', arrival: '09:13', status: 'tarde' }
  ]
}

export const todayClass: TodayClass = {
  name: 'AI Engineering',
  start: '09:00',
  // La demo deja registrar toda la tarde. Con ?hora=21:30 se ve la clase terminada.
  end: '21:00',
  weekdays: [1, 2, 3, 4, 5],
  id: 'ATEMPO-CLASE-1109'
}

export const lateMinutes = 10

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
