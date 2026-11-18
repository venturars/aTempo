import { expect, test } from '@playwright/test'
import {
  useAdminStore,
  type CreateCourseInput,
  type CreateSessionInput,
  type InvitePersonInput,
  type MutationResult
} from '../../web/src/admin/adminStore'

const validCourse: CreateCourseInput = {
  name: 'Nuevo curso',
  teacherId: 'person-teacher',
  studentIds: ['person-student-ana']
}
const validSession: CreateSessionInput = {
  courseId: 'course-web',
  date: '2026-11-20',
  startsAt: '09:00',
  endsAt: '11:00',
  room: 'Aula 4'
}

function valueOf<T>(result: MutationResult<T>): T {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

function expectRejectedWithoutWrite(run: () => MutationResult<unknown>): void {
  const before = useAdminStore.getState()
  const result = run()
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
  expect(useAdminStore.getState()).toBe(before)
}

test.beforeEach(() => {
  useAdminStore.getState().resetDemo()
  useAdminStore.getState().enterDemo()
})

test('invites people, assigns pending people and creates a coherent scheduled session', () => {
  const teacher = valueOf(
    useAdminStore.getState().invitePerson({
      name: '  Elena Docente  ',
      email: ' ELENA@CLASE.TEST ',
      role: 'teacher'
    })
  )
  const student = valueOf(
    useAdminStore.getState().invitePerson({
      name: 'Bruno Alumno',
      email: 'bruno@clase.test',
      role: 'student'
    })
  )
  expect(teacher).toMatchObject({
    name: 'Elena Docente',
    email: 'elena@clase.test',
    state: 'invited',
    roles: ['teacher']
  })
  expect(student).toMatchObject({ state: 'invited', roles: ['student'] })
  const course = valueOf(
    useAdminStore.getState().createCourse({
      name: '  Curso nuevo  ',
      teacherId: teacher.id,
      studentIds: [student.id]
    })
  )
  const session = valueOf(
    useAdminStore.getState().createSession({ ...validSession, courseId: course.id })
  )
  expect(course).toMatchObject({
    name: 'Curso nuevo',
    teacherId: teacher.id,
    studentIds: [student.id]
  })
  expect(session).toMatchObject({
    courseId: course.id,
    organizationId: course.organizationId,
    state: 'scheduled'
  })
  expect(useAdminStore.getState().people.find((person) => person.id === teacher.id)?.state).toBe(
    'invited'
  )
  expect(useAdminStore.getState().people.find((person) => person.id === student.id)?.state).toBe(
    'invited'
  )
  expect(JSON.stringify(useAdminStore.getState())).not.toContain('password')
})

test('the admin is also an eligible teacher and IDs remain independent of names', () => {
  const admin = useAdminStore.getState().people.find((person) => person.id === 'person-admin')!
  expect(admin.roles).toEqual(['admin', 'teacher'])
  const first = valueOf(
    useAdminStore.getState().createCourse({ ...validCourse, teacherId: admin.id })
  )
  const second = valueOf(
    useAdminStore.getState().createCourse({ ...validCourse, teacherId: admin.id })
  )
  expect(first.id).not.toBe(second.id)
  expect(first.teacherId).toBe(admin.id)
  const students = ['person-student-ana']
  const copied = valueOf(
    useAdminStore.getState().createCourse({ ...validCourse, studentIds: students })
  )
  students.push('person-student-luis')
  expect(copied.studentIds).toEqual(['person-student-ana'])
})

for (const input of [
  { name: ' ', email: 'a@clase.test', role: 'student' },
  { name: 'Ana', email: 'not-an-email', role: 'student' },
  { name: 'Ana', email: ' ANA@NEOLAND.EXAMPLE ', role: 'student' },
  { name: 'Otro admin', email: 'otro@clase.test', role: 'admin' }
]) {
  test(`rejects invalid invitation ${JSON.stringify(input)} without writes`, () => {
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().invitePerson(input as InvitePersonInput)
    )
  })
}

for (const input of [
  { ...validCourse, name: ' ' },
  { ...validCourse, teacherId: 'missing' },
  { ...validCourse, teacherId: 'person-student-ana' },
  { ...validCourse, studentIds: ['missing'] },
  { ...validCourse, studentIds: ['person-teacher'] },
  { ...validCourse, studentIds: ['person-student-ana', 'person-student-ana'] }
]) {
  test(`rejects invalid course ${JSON.stringify(input)} without writes`, () => {
    expectRejectedWithoutWrite(() => useAdminStore.getState().createCourse(input))
  })
}

for (const patch of [
  { courseId: 'missing' },
  { date: '2026-02-29' },
  { date: '2026-04-31' },
  { date: '2026-13-01' },
  { date: '0000-01-01' },
  { date: '2026-1-01' },
  { startsAt: '24:00' },
  { endsAt: '09:60' },
  { startsAt: '9:00' },
  { endsAt: '09:00' },
  { endsAt: '08:59' },
  { room: ' ' }
]) {
  test(`rejects invalid session ${JSON.stringify(patch)} without writes`, () => {
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().createSession({ ...validSession, ...patch })
    )
  })
}

test('accepts an actual leap day', () => {
  const session = valueOf(
    useAdminStore.getState().createSession({ ...validSession, date: '2028-02-29' })
  )
  expect(session.date).toBe('2028-02-29')
})

for (const currentPersonId of [null, 'missing', 'person-student-ana', 'person-teacher']) {
  test(`guards all management actions for identity ${currentPersonId}`, () => {
    useAdminStore.setState({ currentPersonId })
    expectRejectedWithoutWrite(() =>
      useAdminStore
        .getState()
        .invitePerson({ name: 'Persona', email: 'persona@clase.test', role: 'student' })
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().createCourse(validCourse))
    expectRejectedWithoutWrite(() => useAdminStore.getState().createSession(validSession))
  })
}

test('rejects people, courses and admin identities from another organisation', () => {
  const state = useAdminStore.getState()
  const foreignTeacher = {
    ...state.people.find((person) => person.id === 'person-teacher')!,
    id: 'foreign-teacher',
    organizationId: 'other'
  }
  const foreignStudent = {
    ...state.people.find((person) => person.id === 'person-student-ana')!,
    id: 'foreign-student',
    organizationId: 'other'
  }
  const foreignCourse = { ...state.courses[0], id: 'foreign-course', organizationId: 'other' }
  useAdminStore.setState({
    people: [...state.people, foreignTeacher, foreignStudent],
    courses: [...state.courses, foreignCourse]
  })
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().createCourse({ ...validCourse, teacherId: foreignTeacher.id })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().createCourse({ ...validCourse, studentIds: [foreignStudent.id] })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().createSession({ ...validSession, courseId: foreignCourse.id })
  )
  useAdminStore.setState({
    people: useAdminStore
      .getState()
      .people.map((person) =>
        person.id === 'person-admin' ? { ...person, organizationId: 'other' } : person
      )
  })
  expectRejectedWithoutWrite(() => useAdminStore.getState().createCourse(validCourse))
  expectRejectedWithoutWrite(() => useAdminStore.getState().enterDemo())
})

test('logout preserves data; reset restores fresh seed and closes the demo', () => {
  valueOf(
    useAdminStore
      .getState()
      .invitePerson({ name: 'Nueva', email: 'nueva@clase.test', role: 'student' })
  )
  const people = useAdminStore.getState().people
  useAdminStore.getState().exitDemo()
  expect(useAdminStore.getState().currentPersonId).toBeNull()
  expect(useAdminStore.getState().people).toBe(people)
  useAdminStore.getState().enterDemo()
  expect(useAdminStore.getState().people).toBe(people)
  useAdminStore.getState().resetDemo()
  expect(useAdminStore.getState().currentPersonId).toBeNull()
  expect(useAdminStore.getState().people).toHaveLength(4)
  expect(useAdminStore.getState().courses).toHaveLength(2)
  expect(useAdminStore.getState().sessions).toHaveLength(2)
  expect(useAdminStore.getState().people).not.toBe(people)
})
