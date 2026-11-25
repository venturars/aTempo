import { course, rosterNames, todayEntry } from '../panel/roster'
import type { CourseStudent, Session } from './contract'
import { isClockTime, isoAt } from './isoTime'

export const fixtureNames = [
  'success',
  'empty',
  'denied',
  'unauthenticated',
  'network',
  'timeout',
  'server-error',
  'conflict',
  'expired-code',
  'code-unavailable'
] as const

export type FixtureName = (typeof fixtureNames)[number]

export function isFixtureName(value: string | null): value is FixtureName {
  return fixtureNames.some((name) => name === value)
}

export const sampleTeacherId = 'teacher-ventura-rodriguez'

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

export function studentIdOf(name: string): string {
  return `student-${slugOf(name)}`
}

export function sampleSession(day: string): Session {
  const endsAt = course.time.split('–')[1] ?? '18:00'
  return {
    id: `session-${day}`,
    courseId: 'course-ai-engineering',
    courseName: course.name,
    startsAt: isoAt(day, course.startsAt),
    endsAt: isoAt(day, endsAt),
    room: course.room,
    state: 'scheduled',
    lateMinutes: 10
  }
}

export function sampleStudents(): CourseStudent[] {
  return rosterNames.map((name) => ({
    studentId: studentIdOf(name),
    name,
    email: `${slugOf(name)}@atempo.test`
  }))
}

export function sampleArrivals(): Record<string, string> {
  const arrivals: Record<string, string> = {}
  rosterNames.forEach((name, index) => {
    const time = todayEntry[index]
    if (time !== undefined && isClockTime(time)) {
      arrivals[studentIdOf(name)] = time
    }
  })
  return arrivals
}
