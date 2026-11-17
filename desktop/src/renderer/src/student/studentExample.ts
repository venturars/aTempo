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
}

export type SampleReading = {
  label: string
  code: string
  arrival: string
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
  code: 'ATEMPO-CLASE-1109'
}

export const lateMinutes = 10

export const sampleReadings: SampleReading[] = [
  { label: 'Llegar a las 08:58', code: todayClass.code, arrival: '08:58' },
  { label: 'Llegar a las 09:14', code: todayClass.code, arrival: '09:14' },
  { label: 'Código de otra clase', code: 'ATEMPO-CLASE-0000', arrival: '09:00' }
]
