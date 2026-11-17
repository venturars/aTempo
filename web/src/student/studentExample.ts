import type { AttendanceStatus } from './attendanceStatus'

export type ClassEntry = {
  label: string
  arrival: string | null
  status: AttendanceStatus
}

export type StudentAccount = {
  name: string
  email: string
  password: string
  history: ClassEntry[]
}

export type TodayClass = {
  label: string
  start: string
  code: string
  pin: string
}

export const exampleStudent: StudentAccount = {
  name: 'Ada López',
  email: 'ada.lopez@clase.test',
  password: 'clase-2026',
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
  label: 'Mié 11 nov',
  start: '09:00',
  code: 'ATEMPO-CLASE-1109',
  pin: '482913'
}

export const lateMinutes = 10

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
