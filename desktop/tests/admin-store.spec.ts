import { execFileSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import {
  useAdminStore,
  previewRecurringSessions,
  type RecurringSessionInput,
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

const weeklyInput: RecurringSessionInput = {
  courseId: 'course-web',
  startDate: '2026-11-02',
  endDate: '2026-11-11',
  weekdays: [1, 3],
  startsAt: '09:00',
  endsAt: '11:00',
  room: ' Aula semanal '
}
const weeklyDates = ['2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11']

test('weekly preview is read-only and one atomic batch creates independent occurrences', () => {
  const before = useAdminStore.getState()
  let writes = 0
  const unsubscribe = useAdminStore.subscribe(() => writes++)
  try {
    expect(valueOf(previewRecurringSessions(before, weeklyInput))).toEqual({
      dates: weeklyDates,
      newDates: weeklyDates,
      candidateCount: 4,
      skippedCount: 0
    })
    expect(useAdminStore.getState()).toBe(before)
    expect(writes).toBe(0)
    const result = valueOf(useAdminStore.getState().createRecurringSessions(weeklyInput))
    expect(writes).toBe(1)
    expect(result.sessions.map((session) => session.date)).toEqual(weeklyDates)
    expect(result).toMatchObject({ candidateCount: 4, skippedCount: 0 })
    expect(new Set(result.sessions.map((session) => session.id)).size).toBe(4)
    for (const session of result.sessions)
      expect(session).toMatchObject({
        courseId: 'course-web',
        organizationId: before.organization.id,
        startsAt: '09:00',
        endsAt: '11:00',
        room: 'Aula semanal',
        state: 'scheduled'
      })
    expect(useAdminStore.getState().people).toBe(before.people)
    expect(useAdminStore.getState().courses).toBe(before.courses)
    const [first, second, ...remaining] = result.sessions
    valueOf(
      useAdminStore.getState().updateSession(first.id, {
        ...validSession,
        date: first.date,
        room: 'Cambio individual'
      })
    )
    valueOf(useAdminStore.getState().deleteSession(second.id))
    expect(useAdminStore.getState().sessions.find((entry) => entry.id === first.id)?.room).toBe(
      'Cambio individual'
    )
    for (const session of remaining) expect(useAdminStore.getState().sessions).toContain(session)
    expect(useAdminStore.getState().sessions).toContain(before.sessions[0])
    const recreated = valueOf(useAdminStore.getState().createRecurringSessions(weeklyInput))
    expect(recreated.sessions.map((session) => session.date)).toEqual([second.date])
    expect(recreated.sessions[0].id).not.toBe(second.id)
    expect(useAdminStore.getState().courses).toBe(before.courses)
  } finally {
    unsubscribe()
  }
})

test('save revalidates current duplicates; room does not distinguish them and resubmission never writes', () => {
  valueOf(previewRecurringSessions(useAdminStore.getState(), weeklyInput))
  valueOf(
    useAdminStore
      .getState()
      .createSession({ ...validSession, date: weeklyDates[0], room: 'Otra aula' })
  )
  // Other courses and overlapping, unequal times must remain eligible.
  valueOf(
    useAdminStore
      .getState()
      .createSession({ ...validSession, courseId: 'course-design', date: weeklyDates[1] })
  )
  valueOf(
    useAdminStore
      .getState()
      .createSession({ ...validSession, date: weeklyDates[2], startsAt: '10:00', endsAt: '12:00' })
  )
  const preview = valueOf(previewRecurringSessions(useAdminStore.getState(), weeklyInput))
  expect(preview).toMatchObject({
    candidateCount: 4,
    skippedCount: 1,
    newDates: weeklyDates.slice(1)
  })
  const created = valueOf(useAdminStore.getState().createRecurringSessions(weeklyInput))
  expect(created.sessions.map((session) => session.date)).toEqual(weeklyDates.slice(1))
  expect(created).toMatchObject({ candidateCount: 4, skippedCount: 1 })
  const before = useAdminStore.getState()
  let writes = 0
  const unsubscribe = useAdminStore.subscribe(() => writes++)
  try {
    expect(
      valueOf(
        useAdminStore.getState().createRecurringSessions({ ...weeklyInput, room: 'Tercera aula' })
      )
    ).toEqual({ sessions: [], candidateCount: 4, skippedCount: 4 })
    expect(useAdminStore.getState()).toBe(before)
    expect(writes).toBe(0)
  } finally {
    unsubscribe()
  }
})

for (const [index, patch] of [
  { startDate: '2026-02-29' },
  { endDate: '2026-04-31' },
  { startDate: '2026-2-01' },
  { startDate: '0000-01-01' },
  { startDate: '2026-11-12' },
  { weekdays: [] },
  { weekdays: [7] },
  { weekdays: [-1] },
  { weekdays: [1.5] },
  { weekdays: [NaN] },
  { weekdays: ['1'] },
  { weekdays: [null] },
  { weekdays: [true] },
  { weekdays: [1, undefined] },
  { weekdays: null },
  { startDate: '2026-11-02', endDate: '2026-11-02', weekdays: [2] },
  { startsAt: '24:00' },
  { startsAt: '9:00' },
  { endsAt: '09:60' },
  { endsAt: '09:00' },
  { endsAt: '08:59' },
  { room: ' ' },
  { courseId: 'missing' }
].entries()) {
  test(`invalid weekly batch ${index}: ${JSON.stringify(patch)} rejects preview and save without partial writes`, () => {
    const input = { ...weeklyInput, ...patch } as RecurringSessionInput
    expectRejectedWithoutWrite(() => previewRecurringSessions(useAdminStore.getState(), input))
    expectRejectedWithoutWrite(() => useAdminStore.getState().createRecurringSessions(input))
  })
}

for (const currentPersonId of [null, 'missing', 'person-student-ana', 'person-teacher']) {
  test(`weekly save rechecks admin identity ${currentPersonId} after a valid preview`, () => {
    valueOf(previewRecurringSessions(useAdminStore.getState(), weeklyInput))
    useAdminStore.setState({ currentPersonId })
    expectRejectedWithoutWrite(() => useAdminStore.getState().createRecurringSessions(weeklyInput))
  })
}

for (const context of ['foreign course', 'foreign admin', 'inactive admin', 'deleted course']) {
  test(`weekly preview and save reject ${context} without writing`, () => {
    valueOf(previewRecurringSessions(useAdminStore.getState(), weeklyInput))
    const state = useAdminStore.getState()
    if (context === 'foreign course')
      useAdminStore.setState({
        courses: state.courses.map((course) =>
          course.id === weeklyInput.courseId ? { ...course, organizationId: 'elsewhere' } : course
        )
      })
    if (context === 'deleted course') valueOf(state.deleteCourse(weeklyInput.courseId))
    if (context === 'foreign admin' || context === 'inactive admin')
      useAdminStore.setState({
        people: state.people.map((person) =>
          person.id === 'person-admin'
            ? {
                ...person,
                ...(context === 'foreign admin'
                  ? { organizationId: 'elsewhere' }
                  : { state: 'invited' as const })
              }
            : person
        )
      })
    expectRejectedWithoutWrite(() =>
      previewRecurringSessions(useAdminStore.getState(), weeklyInput)
    )
    expectRejectedWithoutWrite(() => useAdminStore.getState().createRecurringSessions(weeklyInput))
  })
}

test('preview, invalid and duplicate-only batches do not reserve IDs', () => {
  const expectedFirst = valueOf(useAdminStore.getState().createSession(validSession)).id
  const expectedNext = valueOf(useAdminStore.getState().createSession(validSession)).id
  useAdminStore.getState().resetDemo()
  useAdminStore.getState().enterDemo()
  valueOf(previewRecurringSessions(useAdminStore.getState(), weeklyInput))
  expectRejectedWithoutWrite(() =>
    useAdminStore.getState().createRecurringSessions({ ...weeklyInput, room: '' })
  )
  const first = valueOf(
    useAdminStore.getState().createSession({ ...validSession, date: weeklyDates[0] })
  )
  expect(first.id).toBe(expectedFirst)
  const onlyExisting = { ...weeklyInput, endDate: weeklyDates[0] }
  expect(valueOf(useAdminStore.getState().createRecurringSessions(onlyExisting)).sessions).toEqual(
    []
  )
  const next = valueOf(
    useAdminStore.getState().createRecurringSessions({
      ...weeklyInput,
      startDate: weeklyDates[1],
      endDate: weeklyDates[1]
    })
  )
  expect(next.sessions[0].id).toBe(expectedNext)
})

const calendarCases = [
  { startDate: '2026-11-02', endDate: '2026-11-02', weekdays: [1, 1], dates: ['2026-11-02'] },
  {
    startDate: '2028-02-28',
    endDate: '2028-03-01',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    dates: ['2028-02-28', '2028-02-29', '2028-03-01']
  },
  {
    startDate: '2026-02-28',
    endDate: '2026-03-01',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    dates: ['2026-02-28', '2026-03-01']
  },
  {
    startDate: '2026-12-31',
    endDate: '2027-01-02',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    dates: ['2026-12-31', '2027-01-01', '2027-01-02']
  },
  {
    startDate: '2026-03-07',
    endDate: '2026-03-30',
    weekdays: [0],
    dates: ['2026-03-08', '2026-03-15', '2026-03-22', '2026-03-29']
  },
  {
    startDate: '2026-10-24',
    endDate: '2026-11-02',
    weekdays: [0],
    dates: ['2026-10-25', '2026-11-01']
  }
]

for (const zone of ['UTC', 'Europe/Madrid', 'America/New_York', 'Pacific/Kiritimati']) {
  test(`calendar dates remain inclusive across leap days, year boundaries and DST in ${zone}`, () => {
    // Compile only this TS module inside an isolated Node process, so TZ is set before Date exists.
    const script = `
      const fs = require('node:fs');
      const Module = require('node:module');
      const ts = require(process.argv[1]);
      const filename = process.argv[2];
      const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
      }).outputText;
      const mod = new Module(filename);
      mod.filename = filename;
      mod.paths = Module._nodeModulePaths(require('node:path').dirname(filename));
      mod._compile(compiled, filename);
      const { useAdminStore, previewRecurringSessions } = mod.exports;
      useAdminStore.getState().enterDemo();
      const input = JSON.parse(process.argv[3]);
      const cases = JSON.parse(process.argv[4]);
      console.log(JSON.stringify(cases.map(({ dates, ...patch }) => {
        const result = previewRecurringSessions(useAdminStore.getState(), { ...input, ...patch });
        if (!result.ok) throw new Error(result.error);
        return result.value.dates;
      })));
    `
    const result = execFileSync(
      process.execPath,
      [
        '-e',
        script,
        require.resolve('typescript'),
        require.resolve('../../web/src/admin/adminStore'),
        JSON.stringify(weeklyInput),
        JSON.stringify(calendarCases)
      ],
      { env: { ...process.env, TZ: zone }, timeout: 5000, encoding: 'utf8' }
    )
    expect(JSON.parse(result)).toEqual(calendarCases.map((entry) => entry.dates))
  })
}

test('366 candidates are accepted; 367 and huge year ranges reject before deduplication', () => {
  const allDays = {
    ...weeklyInput,
    startDate: '2028-01-01',
    endDate: '2028-12-31',
    weekdays: [0, 1, 2, 3, 4, 5, 6]
  }
  const preview = valueOf(previewRecurringSessions(useAdminStore.getState(), allDays))
  expect(preview.candidateCount).toBe(366)
  expect(preview.dates).toHaveLength(366)
  expect(preview.dates[0]).toBe('2028-01-01')
  expect(preview.dates[365]).toBe('2028-12-31')
  const created = valueOf(useAdminStore.getState().createRecurringSessions(allDays))
  expect(created.sessions).toHaveLength(366)
  expect(new Set(created.sessions.map((session) => session.id)).size).toBe(366)
  for (const range of [
    { ...allDays, endDate: '2029-01-01' },
    { ...allDays, startDate: '0001-01-01', endDate: '9999-12-31' },
    { ...allDays, startDate: '0001-01-01', endDate: '9999-12-31', weekdays: [1] }
  ]) {
    const start = performance.now()
    expectRejectedWithoutWrite(() => previewRecurringSessions(useAdminStore.getState(), range))
    expectRejectedWithoutWrite(() => useAdminStore.getState().createRecurringSessions(range))
    expect(performance.now() - start).toBeLessThan(1000)
  }
})
