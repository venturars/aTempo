import type { TextKey } from '../lang/messages'
import type { AttendanceStatus } from './attendanceStatus'

// date es la fecha de la clase, «2026-11-10». La pantalla la enseña como «Mar 10 nov».
export type ClassEntry = {
  date: string
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
  date: string
  start: string
  code: string
}

// labelKey es el texto del botón del lector; {time} se rellena con arrival.
export type SampleReading = {
  labelKey: TextKey
  code: string
  arrival: string
}

export const exampleStudent: StudentAccount = {
  name: 'Ada López',
  email: 'ada.lopez@clase.test',
  password: 'clase-2026',
  history: [
    { date: '2026-11-10', arrival: '08:57', status: 'presente' },
    { date: '2026-11-09', arrival: '09:16', status: 'tarde' },
    { date: '2026-11-06', arrival: null, status: 'ausente' },
    { date: '2026-11-05', arrival: '09:02', status: 'presente' },
    { date: '2026-11-03', arrival: '08:59', status: 'presente' },
    { date: '2026-11-02', arrival: '09:13', status: 'tarde' }
  ]
}

export const todayClass: TodayClass = {
  date: '2026-11-11',
  start: '09:00',
  code: 'ATEMPO-CLASE-1109'
}

export const lateMinutes = 10

export const sampleReadings: SampleReading[] = [
  { labelKey: 'student.scan.reader.arriveAt', code: todayClass.code, arrival: '08:58' },
  { labelKey: 'student.scan.reader.arriveAt', code: todayClass.code, arrival: '09:14' },
  { labelKey: 'student.scan.reader.otherClass', code: 'ATEMPO-CLASE-0000', arrival: '09:00' }
]
