import { create } from 'zustand'

export type Person = {
  id: string
  organizationId: string
  name: string
  email: string
  roles: ('admin' | 'teacher' | 'student')[]
  state: 'active' | 'invited'
  identificationDocument?: string
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
  admin?: boolean
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

export type RecurringSessionInput = Omit<CreateSessionInput, 'date'> & {
  startDate: string
  endDate: string
  weekdays: number[]
}
export type RecurringSessionPreview = {
  dates: string[]
  newDates: string[]
  candidateCount: number
  skippedCount: number
}
export type RecurringSessionResult = {
  sessions: ClassSession[]
  candidateCount: number
  skippedCount: number
}

export type AdminData = {
  organization: { id: string; name: string; taxId: string }
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
  createRecurringSessions: (input: RecurringSessionInput) => MutationResult<RecurringSessionResult>
  updatePerson: (id: string, input: InvitePersonInput) => MutationResult<Person>
  deletePerson: (id: string) => MutationResult<null>
  updateCourse: (id: string, input: CreateCourseInput) => MutationResult<Course>
  deleteCourse: (id: string) => MutationResult<null>
  updateSession: (id: string, input: CreateSessionInput) => MutationResult<ClassSession>
  deleteSession: (id: string) => MutationResult<null>
}

const organizationId = 'org-neoland'
const adminId = 'person-admin'

// Each reset gets fresh arrays, including roles and course enrolments.
function createSeed(): AdminData {
  return {
    organization: { id: organizationId, name: 'Neoland', taxId: 'B87654321' },
    currentPersonId: null,
    people: [
      {
        id: adminId,
        organizationId,
        name: 'Ventura Rodríguez',
        email: 'profesor@atempo.test',
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
        name: 'AI Engineering',
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
    return 'Entra con una cuenta administradora de esta organización.'
  }
  return null
}

function cleanText(value: string): string {
  return typeof value === 'string' ? value.trim() : ''
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

function validatePerson(
  state: AdminData,
  input: InvitePersonInput,
  excludedId?: string
): MutationResult<Pick<Person, 'name' | 'email'>> {
  const name = cleanText(input.name)
  const email = cleanText(input.email).toLowerCase()
  if (!name) return { ok: false, error: 'Escribe el nombre de la persona.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'Escribe un correo válido.' }
  if (input.role !== 'teacher' && input.role !== 'student')
    return { ok: false, error: 'Selecciona el rol profesor o alumno.' }
  if (
    input.admin !== undefined &&
    (typeof input.admin !== 'boolean' || (input.admin && input.role !== 'teacher'))
  )
    return { ok: false, error: 'El rol de administrador solo se puede añadir a un profesor.' }
  if (
    state.people.some(
      (person) =>
        person.id !== excludedId &&
        person.organizationId === state.organization.id &&
        person.email.trim().toLowerCase() === email
    )
  )
    return { ok: false, error: 'Ya existe una persona con ese correo en la organización.' }
  return { ok: true, value: { name, email } }
}

function validateCourse(
  state: AdminData,
  input: CreateCourseInput
): MutationResult<Pick<Course, 'name' | 'teacherId' | 'studentIds'>> {
  const name = cleanText(input.name)
  if (!name) return { ok: false, error: 'Escribe el nombre del curso.' }
  const teacher = state.people.find(
    (person) => person.id === input.teacherId && person.organizationId === state.organization.id
  )
  if (!teacher || !teacher.roles.includes('teacher') || teacher.roles.includes('student'))
    return { ok: false, error: 'Selecciona un profesor de la organización.' }
  if (!Array.isArray(input.studentIds))
    return { ok: false, error: 'Selecciona el alumnado del curso.' }
  if (new Set(input.studentIds).size !== input.studentIds.length)
    return { ok: false, error: 'El alumnado del curso no puede contener personas repetidas.' }
  for (const studentId of input.studentIds) {
    const student = state.people.find(
      (person) => person.id === studentId && person.organizationId === state.organization.id
    )
    if (
      !student ||
      !student.roles.includes('student') ||
      student.roles.includes('teacher') ||
      student.roles.includes('admin')
    )
      return { ok: false, error: 'Selecciona alumnos de la organización.' }
  }
  return { ok: true, value: { name, teacherId: teacher.id, studentIds: [...input.studentIds] } }
}

function validateSession(
  state: AdminData,
  input: CreateSessionInput
): MutationResult<Pick<ClassSession, 'courseId' | 'date' | 'startsAt' | 'endsAt' | 'room'>> {
  const course = state.courses.find(
    (entry) => entry.id === input.courseId && entry.organizationId === state.organization.id
  )
  if (!course) return { ok: false, error: 'Selecciona un curso de la organización.' }
  if (!isValidDate(input.date))
    return { ok: false, error: 'Escribe una fecha válida en formato AAAA-MM-DD.' }
  if (!isValidTime(input.startsAt))
    return { ok: false, error: 'Escribe una hora inicial válida en formato HH:mm.' }
  if (!isValidTime(input.endsAt))
    return { ok: false, error: 'Escribe una hora final válida en formato HH:mm.' }
  if (input.endsAt <= input.startsAt)
    return { ok: false, error: 'La hora final debe ser posterior a la inicial en el mismo día.' }
  const room = cleanText(input.room)
  if (!room) return { ok: false, error: 'Escribe el aula de la sesión.' }
  return {
    ok: true,
    value: {
      courseId: course.id,
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      room
    }
  }
}

// Pure preview: no state changes and no IDs reserved. The store calls it again on save.
export function previewRecurringSessions(
  state: AdminData,
  input: RecurringSessionInput
): MutationResult<RecurringSessionPreview> {
  const error = adminError(state)
  if (error) return { ok: false, error }
  if (!isValidDate(input.startDate) || !isValidDate(input.endDate))
    return { ok: false, error: 'Escribe fechas válidas en formato AAAA-MM-DD.' }
  if (input.endDate < input.startDate)
    return { ok: false, error: 'La fecha final debe ser igual o posterior a la inicial.' }
  if (
    !Array.isArray(input.weekdays) ||
    input.weekdays.length === 0 ||
    [...input.weekdays].some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  )
    return { ok: false, error: 'Selecciona al menos un día de la semana válido.' }
  const validSession = validateSession(state, { ...input, date: input.startDate })
  if (!validSession.ok) return validSession

  const dayMilliseconds = 24 * 60 * 60 * 1000
  const start = new Date(`${input.startDate}T00:00:00Z`)
  const end = new Date(`${input.endDate}T00:00:00Z`)
  const rangeDays = (end.getTime() - start.getTime()) / dayMilliseconds
  const offsets = [...new Set(input.weekdays)].map((day) => (day - start.getUTCDay() + 7) % 7)
  const candidateCount = offsets.reduce(
    (total, offset) => total + (offset > rangeDays ? 0 : Math.floor((rangeDays - offset) / 7) + 1),
    0
  )
  if (candidateCount > 366)
    return {
      ok: false,
      error: 'El lote supera el máximo de 366 sesiones. Reduce el rango o los días.'
    }
  if (candidateCount === 0)
    return { ok: false, error: 'No hay fechas que coincidan con los días seleccionados.' }

  const dates: string[] = []
  for (const offset of offsets) {
    for (let day = offset; day <= rangeDays; day += 7) {
      dates.push(new Date(start.getTime() + day * dayMilliseconds).toISOString().slice(0, 10))
    }
  }
  dates.sort()
  const existingDates = new Set(
    state.sessions
      .filter(
        (session) =>
          session.organizationId === state.organization.id &&
          session.courseId === input.courseId &&
          session.startsAt === input.startsAt &&
          session.endsAt === input.endsAt
      )
      .map((session) => session.date)
  )
  const newDates = dates.filter((date) => !existingDates.has(date))
  return {
    ok: true,
    value: { dates, newDates, candidateCount, skippedCount: candidateCount - newDates.length }
  }
}

export const useAdminStore = create<AdminStore>((set, get) => {
  const seed = createSeed()
  let counters = {
    person: seed.people.length,
    course: seed.courses.length,
    session: seed.sessions.length
  }
  function nextId(prefix: keyof typeof counters, entries: { id: string }[]): string {
    let number = counters[prefix] + 1
    while (entries.some((entry) => entry.id === `${prefix}-${number}`)) number += 1
    counters[prefix] = number
    return `${prefix}-${number}`
  }
  return {
    ...seed,
    enterDemo: () => {
      const state = get()
      const person = state.people.find((entry) => entry.id === adminId)
      if (
        !person ||
        person.organizationId !== state.organization.id ||
        person.state !== 'active' ||
        !person.roles.includes('admin')
      )
        return { ok: false, error: 'No se encuentra la cuenta administradora de la demo.' }
      set({ currentPersonId: person.id })
      return { ok: true, value: person }
    },
    exitDemo: () => {
      set({ currentPersonId: null })
      return { ok: true, value: null }
    },
    resetDemo: () => {
      const fresh = createSeed()
      counters = {
        person: fresh.people.length,
        course: fresh.courses.length,
        session: fresh.sessions.length
      }
      set(fresh)
      return { ok: true, value: null }
    },
    invitePerson: (input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const result = validatePerson(state, input)
      if (!result.ok) return result
      const person: Person = {
        id: nextId('person', state.people),
        organizationId: state.organization.id,
        ...result.value,
        roles: input.admin ? ['admin', 'teacher'] : [input.role],
        state: 'invited'
      }
      set({ people: [...state.people, person] })
      return { ok: true, value: person }
    },
    updatePerson: (id, input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const existing = state.people.find(
        (person) => person.id === id && person.organizationId === state.organization.id
      )
      if (!existing) return { ok: false, error: 'No se encuentra la persona en la organización.' }
      const isAdmin = existing.roles.includes('admin')
      const preserveRoles =
        isAdmin && (id === state.currentPersonId || !existing.roles.includes('teacher'))
      const result = validatePerson(state, input, id)
      if (!result.ok) return result
      const roles: Person['roles'] = preserveRoles ? [...existing.roles] : [input.role]
      if (!preserveRoles && input.role === 'teacher' && (input.admin ?? isAdmin)) {
        roles.unshift('admin')
      }
      if (!roles.includes('teacher') && state.courses.some((course) => course.teacherId === id))
        return { ok: false, error: 'Reasigna los cursos de esta persona antes de cambiar su rol.' }
      if (
        !roles.includes('student') &&
        state.courses.some((course) => course.studentIds.includes(id))
      )
        return { ok: false, error: 'Retira sus matrículas antes de cambiar su rol.' }
      const person: Person = { ...existing, ...result.value, roles }
      set({ people: state.people.map((entry) => (entry.id === id ? person : entry)) })
      return { ok: true, value: person }
    },
    deletePerson: (id) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const person = state.people.find(
        (entry) => entry.id === id && entry.organizationId === state.organization.id
      )
      if (!person) return { ok: false, error: 'No se encuentra la persona en la organización.' }
      if (id === state.currentPersonId)
        return { ok: false, error: 'No puedes eliminar tu propia cuenta administradora.' }
      if (state.courses.some((course) => course.teacherId === id))
        return { ok: false, error: 'Reasigna sus cursos antes de eliminar al profesor.' }
      if (
        state.courses.some(
          (course) =>
            course.organizationId !== state.organization.id && course.studentIds.includes(id)
        )
      )
        return { ok: false, error: 'La persona tiene matrículas fuera de esta organización.' }
      set({
        people: state.people.filter((entry) => entry.id !== id),
        courses: state.courses.map((course) =>
          course.organizationId === state.organization.id && course.studentIds.includes(id)
            ? { ...course, studentIds: course.studentIds.filter((studentId) => studentId !== id) }
            : course
        )
      })
      return { ok: true, value: null }
    },
    createCourse: (input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const result = validateCourse(state, input)
      if (!result.ok) return result
      const course: Course = {
        id: nextId('course', state.courses),
        organizationId: state.organization.id,
        ...result.value
      }
      set({ courses: [...state.courses, course] })
      return { ok: true, value: course }
    },
    updateCourse: (id, input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const existing = state.courses.find(
        (course) => course.id === id && course.organizationId === state.organization.id
      )
      if (!existing) return { ok: false, error: 'No se encuentra el curso en la organización.' }
      const result = validateCourse(state, input)
      if (!result.ok) return result
      const course: Course = { ...existing, ...result.value }
      set({ courses: state.courses.map((entry) => (entry.id === id ? course : entry)) })
      return { ok: true, value: course }
    },
    deleteCourse: (id) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const course = state.courses.find(
        (entry) => entry.id === id && entry.organizationId === state.organization.id
      )
      if (!course) return { ok: false, error: 'No se encuentra el curso en la organización.' }
      if (
        state.sessions.some(
          (session) => session.courseId === id && session.organizationId !== state.organization.id
        )
      )
        return { ok: false, error: 'El curso tiene sesiones fuera de esta organización.' }
      set({
        courses: state.courses.filter((entry) => entry.id !== id),
        sessions: state.sessions.filter(
          (session) => session.courseId !== id || session.organizationId !== state.organization.id
        )
      })
      return { ok: true, value: null }
    },
    createSession: (input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const result = validateSession(state, input)
      if (!result.ok) return result
      const session: ClassSession = {
        id: nextId('session', state.sessions),
        organizationId: state.organization.id,
        ...result.value,
        state: 'scheduled'
      }
      set({ sessions: [...state.sessions, session] })
      return { ok: true, value: session }
    },
    createRecurringSessions: (input) => {
      const state = get()
      const preview = previewRecurringSessions(state, input)
      if (!preview.ok) return preview
      const { newDates, candidateCount, skippedCount } = preview.value
      // Validate the complete batch before allocating IDs or writing anything.
      const validated: CreateSessionInput[] = []
      for (const date of newDates) {
        const result = validateSession(state, { ...input, date })
        if (!result.ok) return result
        validated.push(result.value)
      }
      const sessions: ClassSession[] = validated.map((value) => ({
        id: nextId('session', state.sessions),
        organizationId: state.organization.id,
        ...value,
        state: 'scheduled'
      }))
      if (sessions.length > 0) set({ sessions: [...state.sessions, ...sessions] })
      return { ok: true, value: { sessions, candidateCount, skippedCount } }
    },
    updateSession: (id, input) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const existing = state.sessions.find(
        (session) => session.id === id && session.organizationId === state.organization.id
      )
      if (!existing) return { ok: false, error: 'No se encuentra la sesión en la organización.' }
      if (input.courseId !== existing.courseId)
        return { ok: false, error: 'La sesión debe conservar su curso.' }
      const result = validateSession(state, input)
      if (!result.ok) return result
      const session: ClassSession = { ...existing, ...result.value }
      set({ sessions: state.sessions.map((entry) => (entry.id === id ? session : entry)) })
      return { ok: true, value: session }
    },
    deleteSession: (id) => {
      const state = get()
      const error = adminError(state)
      if (error) return { ok: false, error }
      const session = state.sessions.find(
        (entry) => entry.id === id && entry.organizationId === state.organization.id
      )
      if (!session) return { ok: false, error: 'No se encuentra la sesión en la organización.' }
      if (
        !state.courses.some(
          (course) =>
            course.id === session.courseId && course.organizationId === state.organization.id
        )
      )
        return { ok: false, error: 'Selecciona un curso de la organización.' }
      set({ sessions: state.sessions.filter((entry) => entry.id !== id) })
      return { ok: true, value: null }
    }
  }
})
