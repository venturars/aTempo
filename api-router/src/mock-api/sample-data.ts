import type { CourseStudentDto, SessionDto } from './dto'

export const sampleTimeZone = '+01:00'

export const sampleTeacherId = 'teacher-ventura-rodriguez'

export const sampleCourse = {
  id: 'course-ai-engineering',
  name: 'AI Engineering',
  startsAt: '09:00',
  endsAt: '18:00',
  room: 'Aula 3',
  lateMinutes: 10,
}

const rosterNames = [
  'Diego Molero',
  'Diego Torres',
  'Ella Deyavorsky',
  'Esther Patino',
  'Jimena Duran',
  'Jose Miguel',
  'Luis Duque',
  'Manuel Diaz',
  'Maria Osipuk',
  'Meghan Martin',
  'Miguel Rodriguez',
  'Raul Santamaria',
  'Sergio Cortes',
  'Sergio Moras',
  'Victor Chang',
]

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

export function isoAt(day: string, time: string): string {
  return `${day}T${time}:00${sampleTimeZone}`
}

export function dayOf(iso: string): string {
  return iso.slice(0, 10)
}

export function sampleDay(now: number = Date.now()): string {
  return new Date(now + 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function sampleSession(day: string): SessionDto {
  return {
    id: `session-${day}`,
    courseId: sampleCourse.id,
    courseName: sampleCourse.name,
    startsAt: isoAt(day, sampleCourse.startsAt),
    endsAt: isoAt(day, sampleCourse.endsAt),
    room: sampleCourse.room,
    state: 'scheduled',
    lateMinutes: sampleCourse.lateMinutes,
  }
}

export function sampleStudents(): CourseStudentDto[] {
  return rosterNames.map((name) => ({
    studentId: `student-${slugOf(name)}`,
    name,
    email: `${slugOf(name)}@atempo.test`,
  }))
}
