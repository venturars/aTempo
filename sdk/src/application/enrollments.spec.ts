import { createSdk } from '../composition/create-sdk'

const admin = {
  name: 'Neoland',
  taxId: 'b-87.654.321',
  firstName: 'Ventura',
  lastName: 'Rodríguez',
  identificationDocument: '12345678-a',
  email: '  Profesor@aTempo.TEST ',
}

const courseInput = {
  name: 'Inglés B1',
  acronym: 'B1',
  startAt: '2026-01-01T09:00:00.000Z',
  endAt: '2026-06-30T18:00:00.000Z',
  contractAddress: '0x0000000000000000000000000000000000000001',
}

describe('course enrolments', () => {
  it('creates a course and enrolls a student', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const organizationId = created.value.organization.id

    const student = await sdk.invitePerson({
      organizationId,
      firstName: 'Ada',
      lastName: 'López',
      identificationDocument: '11223344C',
      email: 'ada.lopez@clase.test',
      role: 'student',
    })
    expect(student.ok).toBe(true)
    if (!student.ok) return

    const course = await sdk.createCourse({ organizationId, ...courseInput })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    const enrolled = await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: student.value.id,
    })
    expect(enrolled.ok).toBe(true)

    const list = await sdk.listCoursePeople({
      organizationId,
      courseId: course.value.id,
    })
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.value).toHaveLength(1)
    expect(list.value[0]?.id).toBe(student.value.id)
  })

  it('rejects duplicate enrolment', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const organizationId = created.value.organization.id
    const student = await sdk.invitePerson({
      organizationId,
      firstName: 'Ada',
      lastName: 'López',
      identificationDocument: '11223344C',
      email: 'ada.lopez@clase.test',
      role: 'student',
    })
    expect(student.ok).toBe(true)
    if (!student.ok) return
    const course = await sdk.createCourse({ organizationId, ...courseInput })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    const first = await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: student.value.id,
    })
    const second = await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: student.value.id,
    })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(false)
    if (second.ok) return
    expect(second.error.code).toBe('CONFLICT')
  })

  it('blocks deleting a teacher with course assignments', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const organizationId = created.value.organization.id

    const teacher = await sdk.invitePerson({
      organizationId,
      firstName: 'Lucía',
      lastName: 'García',
      identificationDocument: '87654321B',
      email: 'lucia@neoland.example',
      role: 'teacher',
    })
    expect(teacher.ok).toBe(true)
    if (!teacher.ok) return

    const course = await sdk.createCourse({ organizationId, ...courseInput })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: teacher.value.id,
    })

    const deleted = await sdk.deletePerson({ personId: teacher.value.id })
    expect(deleted.ok).toBe(false)
    if (deleted.ok) return
    expect(deleted.error.code).toBe('VALIDATION')
  })

  it('removes enrolments when deleting a student', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const organizationId = created.value.organization.id

    const student = await sdk.invitePerson({
      organizationId,
      firstName: 'Ada',
      lastName: 'López',
      identificationDocument: '11223344C',
      email: 'ada.lopez@clase.test',
      role: 'student',
    })
    expect(student.ok).toBe(true)
    if (!student.ok) return

    const course = await sdk.createCourse({ organizationId, ...courseInput })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: student.value.id,
    })

    const deleted = await sdk.deletePerson({ personId: student.value.id })
    expect(deleted.ok).toBe(true)

    const list = await sdk.listCoursePeople({
      organizationId,
      courseId: course.value.id,
    })
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.value).toHaveLength(0)
  })
})