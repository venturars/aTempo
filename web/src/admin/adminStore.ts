import { create } from 'zustand'

export type Person = {
  id: string
  organizationId: string
  name: string
  email: string
  roles: ('admin' | 'teacher' | 'student')[]
  state: 'active' | 'invited'
}

export type Course = {
  id: string
  organizationId: string
  name: string
  teacherId: string
  studentIds: string[]
}

export type ClassSession = {
  id: string
  organizationId: string
  courseId: string
  date: string
  startsAt: string
  endsAt: string
  room: string
  state: 'scheduled'
}

export type MutationResult<T> = { ok: true; value: T } | { ok: false; error: string }
export type InvitePersonInput = {
  name: string
  email: string
  role: 'teacher' | 'student'
}
export type CreateCourseInput = {
  name: string
  teacherId: string
  studentIds: string[]
}
export type CreateSessionInput = {
  courseId: string
  date: string
  startsAt: string
  endsAt: string
  room: string
}

type AdminData = {
  organization: { id: string; name: string }
  people: Person[]
  courses: Course[]
  sessions: ClassSession[]
  currentPersonId: string | null
}

export type AdminStore = AdminData & {
  enterDemo: () => MutationResult<Person>
  exitDemo: () => MutationResult<null>
  resetDemo: () => MutationResult<null>
  invitePerson: (input: InvitePersonInput) => MutationResult<Person>
  createCourse: (input: CreateCourseInput) => MutationResult<Course>
  createSession: (input: CreateSessionInput) => MutationResult<ClassSession>
}

const organizationId = 'org-neoland'
const adminId = 'person-admin'

// Each reset gets fresh arrays, including roles and course enrolments.
function createSeed(): AdminData {
  return {
    organization: { id: organizationId, name: 'Neoland' },
    currentPersonId: null,
    people: [
      {
        id: adminId,
        organizationId,
        name: 'Miguel Rodríguez',
        email: 'miguel@neoland.example',
        roles: ['admin', 'teacher'],
        state: 'active'
      },
      {
        id: 'person-teacher',
        organizationId,
        name: 'Lucía García',
        email: 'lucia@neoland.example',
        roles: ['teacher'],
        state: 'active'
      },
      {
        id: 'person-student-ana',
        organizationId,
        name: 'Ana López',
        email: 'ana@neoland.example',
        roles: ['student'],
        state: 'active'
      },
      {
        id: 'person-student-luis',
        organizationId,
        name: 'Luis Martín',
        email: 'luis@neoland.example',
        roles: ['student'],
        state: 'active'
      }
    ],
    courses: [
      {
        id: 'course-web',
        organizationId,
        name: 'Desarrollo web',
        teacherId: adminId,
        studentIds: ['person-student-ana', 'person-student-luis']
      },
      {
        id: 'course-design',
        organizationId,
        name: 'Diseño UX/UI',
        teacherId: 'person-teacher',
        studentIds: ['person-student-ana']
      }
    ],
    sessions: [
      {
        id: 'session-web',
        organizationId,
        courseId: 'course-web',
        date: '2026-11-19',
        startsAt: '09:00',
        endsAt: '11:00',
        room: 'Aula 1',
        state: 'scheduled'
      },
      {
        id: 'session-design',
        organizationId,
        courseId: 'course-design',
        date: '2026-11-20',
        startsAt: '10:00',
        endsAt: '12:00',
        room: 'Aula 2',
        state: 'scheduled'
      }
    ]
  }
}

function adminError(state: AdminData): string | null {
  const person = state.people.find((entry) => entry.id === state.currentPersonId)
  if (
    !person ||
    person.organizationId !== state.organization.id ||
    person.state !== 'active' ||
    !person.roles.includes('admin')
  ) {
    return 'Abre la demo con una cuenta administradora de esta organización.'
  }
  return null
}

function cleanText(value: string): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nextId(prefix: string, entries: { id: string }[]): string {
  let number = entries.length + 1
  while (entries.some((entry) => entry.id === `${prefix}-${number}`)) number += 1
  return `${prefix}-${number}`
}

function isValidDate(value: string): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysInMonth[month - 1]
}

function isValidTime(value: string): boolean {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  ...createSeed(),
  enterDemo: () => {
    const state = get()
    const person = state.people.find((entry) => entry.id === adminId)
    if (
      !person ||
      person.organizationId !== state.organization.id ||
      person.state !== 'active' ||
      !person.roles.includes('admin')
    ) {
      return {
        ok: false,
        error: 'No se encuentra la cuenta administradora de la demo.'
      }
    }
    set({ currentPersonId: person.id })
    return { ok: true, value: person }
  },
  exitDemo: () => {
    set({ currentPersonId: null })
    return { ok: true, value: null }
  },
  resetDemo: () => {
    set(createSeed())
    return { ok: true, value: null }
  },
  invitePerson: (input) => {
    const state = get()
    const error = adminError(state)
    if (error) return { ok: false, error }
    const name = cleanText(input.name)
    const email = cleanText(input.email).toLowerCase()
    if (!name) return { ok: false, error: 'Escribe el nombre de la persona.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: 'Escribe un correo válido.' }
    if (input.role !== 'teacher' && input.role !== 'student')
      return { ok: false, error: 'Selecciona el rol profesor o alumno.' }
    if (
      state.people.some(
        (person) =>
          person.organizationId === state.organization.id &&
          person.email.trim().toLowerCase() === email
      )
    ) {
      return {
        ok: false,
        error: 'Ya existe una persona con ese correo en la organización.'
      }
    }
    const person: Person = {
      id: nextId('person', state.people),
      organizationId: state.organization.id,
      name,
      email,
      roles: [input.role],
      state: 'invited'
    }
    set({ people: [...state.people, person] })
    return { ok: true, value: person }
  },
  createCourse: (input) => {
    const state = get()
    const error = adminError(state)
    if (error) return { ok: false, error }
    const name = cleanText(input.name)
    if (!name) return { ok: false, error: 'Escribe el nombre del curso.' }
    const teacher = state.people.find(
      (person) => person.id === input.teacherId && person.organizationId === state.organization.id
    )
    if (!teacher || !teacher.roles.includes('teacher'))
      return { ok: false, error: 'Selecciona un profesor de la organización.' }
    if (!Array.isArray(input.studentIds))
      return { ok: false, error: 'Selecciona el alumnado del curso.' }
    if (new Set(input.studentIds).size !== input.studentIds.length)
      return {
        ok: false,
        error: 'El alumnado del curso no puede contener personas repetidas.'
      }
    for (const studentId of input.studentIds) {
      const student = state.people.find(
        (person) => person.id === studentId && person.organizationId === state.organization.id
      )
      if (!student || !student.roles.includes('student'))
        return { ok: false, error: 'Selecciona alumnos de la organización.' }
    }
    const course: Course = {
      id: nextId('course', state.courses),
      organizationId: state.organization.id,
      name,
      teacherId: teacher.id,
      studentIds: [...input.studentIds]
    }
    set({ courses: [...state.courses, course] })
    return { ok: true, value: course }
  },
  createSession: (input) => {
    const state = get()
    const error = adminError(state)
    if (error) return { ok: false, error }
    const course = state.courses.find(
      (entry) => entry.id === input.courseId && entry.organizationId === state.organization.id
    )
    if (!course) return { ok: false, error: 'Selecciona un curso de la organización.' }
    if (!isValidDate(input.date))
      return {
        ok: false,
        error: 'Escribe una fecha válida en formato AAAA-MM-DD.'
      }
    if (!isValidTime(input.startsAt))
      return {
        ok: false,
        error: 'Escribe una hora inicial válida en formato HH:mm.'
      }
    if (!isValidTime(input.endsAt))
      return {
        ok: false,
        error: 'Escribe una hora final válida en formato HH:mm.'
      }
    if (input.endsAt <= input.startsAt)
      return {
        ok: false,
        error: 'La hora final debe ser posterior a la inicial en el mismo día.'
      }
    const room = cleanText(input.room)
    if (!room) return { ok: false, error: 'Escribe el aula de la sesión.' }
    const session: ClassSession = {
      id: nextId('session', state.sessions),
      organizationId: state.organization.id,
      courseId: course.id,
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      room,
      state: 'scheduled'
    }
    set({ sessions: [...state.sessions, session] })
    return { ok: true, value: session }
  }
}))
