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

test('edits people in place, normalizes email and preserves invitation and admin roles', () => {
  const invited = valueOf(
    useAdminStore.getState().invitePerson({
      name: 'Nueva',
      email: 'nueva@clase.test',
      role: 'student'
    })
  )
  const edited = valueOf(
    useAdminStore.getState().updatePerson(invited.id, {
      name: '  Nombre corregido  ',
      email: ' NUEVA@CLASE.TEST ',
      role: 'teacher'
    })
  )
  expect(edited).toEqual({ ...invited, name: 'Nombre corregido', roles: ['teacher'] })
  expect(useAdminStore.getState().people).toHaveLength(5)
  const admin = valueOf(
    useAdminStore.getState().updatePerson('person-admin', {
      name: 'Miguel Docente',
      email: 'MIGUEL@NEOLAND.EXAMPLE',
      role: 'teacher'
    })
  )
  expect(admin.roles).toEqual(['admin', 'teacher'])
  expect(admin.state).toBe('active')
  const unchangedRoles = valueOf(
    useAdminStore.getState().updatePerson('person-admin', {
      name: 'Miguel',
      email: 'miguel@neoland.example',
      role: 'student'
    })
  )
  expect(unchangedRoles.roles).toEqual(['admin', 'teacher'])
  expectRejectedWithoutWrite(() => useAdminStore.getState().deletePerson('person-admin'))
})

test('a legitimate admin-only person can edit their details without gaining another role', () => {
  const course = useAdminStore.getState().courses.find((item) => item.id === 'course-web')!
  valueOf(
    useAdminStore.getState().updateCourse(course.id, {
      name: course.name,
      teacherId: 'person-teacher',
      studentIds: course.studentIds
    })
  )
  useAdminStore.setState({
    people: useAdminStore
      .getState()
      .people.map((person) =>
        person.id === 'person-admin' ? { ...person, roles: ['admin'] } : person
      )
  })
  const edited = valueOf(
    useAdminStore.getState().updatePerson('person-admin', {
      name: '  Administración  ',
      email: ' ADMIN@NEOLAND.EXAMPLE ',
      role: 'student'
    })
  )
  expect(edited).toMatchObject({
    id: 'person-admin',
    name: 'Administración',
    email: 'admin@neoland.example',
    roles: ['admin'],
    state: 'active'
  })
  expect(useAdminStore.getState().currentPersonId).toBe('person-admin')
  valueOf(useAdminStore.getState().createCourse(validCourse))
})

test('rejects duplicate emails and role changes that would break existing assignments', () => {
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().updatePerson('person-student-ana', {
      name: 'Ana',
      email: ' LUIS@NEOLAND.EXAMPLE ',
      role: 'student'
    })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().updatePerson('person-student-ana', {
      name: 'Ana',
      email: 'ana@neoland.example',
      role: 'teacher'
    })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().updatePerson('person-teacher', {
      name: 'Lucía',
      email: 'lucia@neoland.example',
      role: 'student'
    })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().updatePerson('person-student-ana', {
      name: '',
      email: 'ana@neoland.example',
      role: 'student'
    })
  )
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().updatePerson('person-student-ana', {
      name: 'Ana',
      email: 'invalid',
      role: 'student'
    })
  )
})

test('deleting a student removes all own enrolments atomically and leaves sessions intact', () => {
  const before = useAdminStore.getState()
  const foreignCourse = {
    ...before.courses[0],
    id: 'foreign',
    organizationId: 'elsewhere',
    studentIds: ['foreign-student']
  }
  useAdminStore.setState({ courses: [...before.courses, foreignCourse] })
  let writes = 0
  const unsubscribe = useAdminStore.subscribe(() => writes++)
  try {
    valueOf(useAdminStore.getState().deletePerson('person-student-ana'))
    expect(writes).toBe(1)
    const after = useAdminStore.getState()
    expect(after.people.some((person) => person.id === 'person-student-ana')).toBe(false)
    expect(
      after.courses
        .filter((course) => course.organizationId === after.organization.id)
        .every((course) => !course.studentIds.includes('person-student-ana'))
    ).toBe(true)
    expect(after.courses.find((course) => course.id === foreignCourse.id)).toBe(foreignCourse)
    expect(after.sessions).toBe(before.sessions)
  } finally {
    unsubscribe()
  }
})

test('an assigned teacher can only be deleted after reassignment', () => {
  expectRejectedWithoutWrite(() => useAdminStore.getState().deletePerson('person-teacher'))
  const course = useAdminStore.getState().courses.find((item) => item.id === 'course-design')!
  valueOf(
    useAdminStore.getState().updateCourse(course.id, {
      name: course.name,
      teacherId: 'person-admin',
      studentIds: course.studentIds
    })
  )
  valueOf(useAdminStore.getState().deletePerson('person-teacher'))
  expect(useAdminStore.getState().people.some((person) => person.id === 'person-teacher')).toBe(
    false
  )
  expect(useAdminStore.getState().courses.find((item) => item.id === course.id)?.teacherId).toBe(
    'person-admin'
  )
})

test('course edits preserve IDs and sessions while changing the teacher and roster', () => {
  const before = useAdminStore.getState()
  const edited = valueOf(
    useAdminStore.getState().updateCourse('course-web', {
      name: '  Curso actualizado ',
      teacherId: 'person-teacher',
      studentIds: ['person-student-luis']
    })
  )
  expect(edited).toEqual({
    ...before.courses[0],
    name: 'Curso actualizado',
    teacherId: 'person-teacher',
    studentIds: ['person-student-luis']
  })
  expect(useAdminStore.getState().sessions).toBe(before.sessions)
  for (const input of [
    { ...validCourse, name: '' },
    { ...validCourse, teacherId: 'person-student-ana' },
    { ...validCourse, studentIds: ['person-teacher'] },
    { ...validCourse, studentIds: ['person-student-ana', 'person-student-ana'] }
  ])
    expectRejectedWithoutWrite(() => useAdminStore.getState().updateCourse('course-web', input))
})

test('deleting a course atomically removes only its own sessions and no people', () => {
  const before = useAdminStore.getState()
  const foreignSession = {
    ...before.sessions[0],
    id: 'foreign-session',
    organizationId: 'elsewhere',
    courseId: 'foreign-course'
  }
  useAdminStore.setState({ sessions: [...before.sessions, foreignSession] })
  let writes = 0
  const unsubscribe = useAdminStore.subscribe(() => writes++)
  try {
    valueOf(useAdminStore.getState().deleteCourse('course-web'))
    expect(writes).toBe(1)
    const after = useAdminStore.getState()
    expect(after.courses.map((course) => course.id)).toEqual(['course-design'])
    expect(after.sessions.map((session) => session.id)).toEqual([
      'session-design',
      'foreign-session'
    ])
    expect(after.people).toBe(before.people)
  } finally {
    unsubscribe()
  }
})

test('session edits keep their course and deleting one leaves courses and other sessions intact', () => {
  const before = useAdminStore.getState()
  const edited = valueOf(
    useAdminStore.getState().updateSession('session-web', {
      ...validSession,
      date: '2026-12-01',
      startsAt: '12:00',
      endsAt: '13:30',
      room: ' Aula 8 '
    })
  )
  expect(edited).toEqual({
    ...before.sessions[0],
    date: '2026-12-01',
    startsAt: '12:00',
    endsAt: '13:30',
    room: 'Aula 8'
  })
  for (const patch of [
    { courseId: 'course-design' },
    { date: '2026-02-29' },
    { startsAt: '24:00' },
    { endsAt: '09:00' },
    { room: '' }
  ]) {
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().updateSession('session-web', {
        ...validSession,
        ...patch
      })
    )
  }
  valueOf(useAdminStore.getState().deleteSession('session-web'))
  expect(useAdminStore.getState().sessions.map((session) => session.id)).toEqual(['session-design'])
  expect(useAdminStore.getState().courses).toBe(before.courses)
  expect(useAdminStore.getState().people).toBe(before.people)
})

test('new IDs never reuse deleted people, courses or sessions in the same run', () => {
  const personInput: InvitePersonInput = {
    name: 'Temporal',
    email: 'temp@clase.test',
    role: 'student'
  }
  const person = valueOf(useAdminStore.getState().invitePerson(personInput))
  valueOf(useAdminStore.getState().deletePerson(person.id))
  expect(valueOf(useAdminStore.getState().invitePerson(personInput)).id).not.toBe(person.id)
  const course = valueOf(useAdminStore.getState().createCourse(validCourse))
  valueOf(useAdminStore.getState().deleteCourse(course.id))
  expect(valueOf(useAdminStore.getState().createCourse(validCourse)).id).not.toBe(course.id)
  const session = valueOf(useAdminStore.getState().createSession(validSession))
  valueOf(useAdminStore.getState().deleteSession(session.id))
  expect(valueOf(useAdminStore.getState().createSession(validSession)).id).not.toBe(session.id)
})

for (const currentPersonId of [null, 'missing', 'person-student-ana', 'person-teacher']) {
  test(`guards all update and delete actions for ${currentPersonId}`, () => {
    useAdminStore.setState({ currentPersonId })
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().updatePerson('person-student-ana', {
        name: 'Ana',
        email: 'ana@neoland.example',
        role: 'student'
      })
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().deletePerson('person-student-ana'))
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().updateCourse('course-web', validCourse)
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().deleteCourse('course-web'))
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().updateSession('session-web', validSession)
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().deleteSession('session-web'))
  })
}

test('unknown and foreign entity IDs cannot be updated or deleted', () => {
  const state = useAdminStore.getState()
  useAdminStore.setState({
    people: [...state.people, { ...state.people[2], id: 'foreign', organizationId: 'elsewhere' }],
    courses: [
      ...state.courses,
      { ...state.courses[0], id: 'foreign', organizationId: 'elsewhere' }
    ],
    sessions: [
      ...state.sessions,
      { ...state.sessions[0], id: 'foreign', organizationId: 'elsewhere' }
    ]
  })
  for (const id of ['missing', 'foreign']) {
    expectRejectedWithoutWrite(() =>
      useAdminStore.getState().updatePerson(id, {
        name: 'Persona',
        email: 'persona@clase.test',
        role: 'student'
      })
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().deletePerson(id))
    expectRejectedWithoutWrite(() => useAdminStore.getState().updateCourse(id, validCourse))
    expectRejectedWithoutWrite(() => useAdminStore.getState().deleteCourse(id))
    expectRejectedWithoutWrite(() => useAdminStore.getState().updateSession(id, validSession))
    expectRejectedWithoutWrite(() => useAdminStore.getState().deleteSession(id))
  }
})

test('rejects deletion without writes when malformed foreign records reference an owned entity', () => {
  const state = useAdminStore.getState()
  useAdminStore.setState({
    courses: [
      ...state.courses,
      { ...state.courses[0], id: 'foreign-course', organizationId: 'elsewhere' }
    ],
    sessions: [
      ...state.sessions,
      { ...state.sessions[0], id: 'foreign-session', organizationId: 'elsewhere' }
    ]
  })
  expectRejectedWithoutWrite(() => useAdminStore.getState().deletePerson('person-student-ana'))
  expectRejectedWithoutWrite(() => useAdminStore.getState().deleteCourse('course-web'))
})
