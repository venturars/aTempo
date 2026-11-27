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

  it('lists courses of an organization and none of another', async () => {
    const sdk = createSdk()
    const first = await sdk.createOrganization(admin)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = await sdk.createOrganization({
      ...admin,
      name: 'Otra',
      taxId: 'A12345678',
      identificationDocument: '11111111C',
      email: 'otra@atempo.test',
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return

    const english = await sdk.createCourse({
      organizationId: first.value.organization.id,
      ...courseInput,
    })
    const french = await sdk.createCourse({
      organizationId: first.value.organization.id,
      ...courseInput,
      name: 'Francés A2',
      acronym: 'A2',
      contractAddress: '0x0000000000000000000000000000000000000002',
    })
    const other = await sdk.createCourse({
      organizationId: second.value.organization.id,
      ...courseInput,
      contractAddress: '0x0000000000000000000000000000000000000003',
    })
    expect(english.ok && french.ok && other.ok).toBe(true)
    if (!english.ok || !french.ok || !other.ok) return

    const list = await sdk.listCourses({
      organizationId: first.value.organization.id,
    })
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.value.map((course) => course.id).sort()).toEqual(
      [english.value.id, french.value.id].sort(),
    )
  })

  it('returns an empty course list when the organization has none', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const list = await sdk.listCourses({
      organizationId: created.value.organization.id,
    })
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.value).toEqual([])
  })

  it('reads a course of its organization', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const course = await sdk.createCourse({
      organizationId: created.value.organization.id,
      ...courseInput,
    })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    const found = await sdk.getCourse({
      organizationId: created.value.organization.id,
      courseId: course.value.id,
    })
    expect(found.ok).toBe(true)
    if (!found.ok) return
    expect(found.value).toMatchObject({
      id: course.value.id,
      organizationId: created.value.organization.id,
      name: 'Inglés B1',
      acronym: 'B1',
      startAt: courseInput.startAt,
      endAt: courseInput.endAt,
      contractAddress: '0x0000000000000000000000000000000000000001',
    })
  })

  it('rejects a course from another organization', async () => {
    const sdk = createSdk()
    const first = await sdk.createOrganization(admin)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = await sdk.createOrganization({
      ...admin,
      name: 'Otra',
      taxId: 'A12345678',
      identificationDocument: '11111111C',
      email: 'otra@atempo.test',
    })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    const course = await sdk.createCourse({
      organizationId: second.value.organization.id,
      ...courseInput,
    })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    const found = await sdk.getCourse({
      organizationId: first.value.organization.id,
      courseId: course.value.id,
    })
    const students = await sdk.listCourseStudents({
      organizationId: first.value.organization.id,
      courseId: course.value.id,
    })
    expect(found.ok).toBe(false)
    expect(students.ok).toBe(false)
    if (found.ok || students.ok) return
    expect(found.error.code).toBe('NOT_FOUND')
    expect(students.error.code).toBe('NOT_FOUND')
  })

  it('lists only enrolled students and keeps all people on the roster', async () => {
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
    const teacher = await sdk.invitePerson({
      organizationId,
      firstName: 'Lucía',
      lastName: 'García',
      identificationDocument: '87654321B',
      email: 'lucia@neoland.example',
      role: 'teacher',
    })
    expect(student.ok && teacher.ok).toBe(true)
    if (!student.ok || !teacher.ok) return

    const course = await sdk.createCourse({ organizationId, ...courseInput })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: student.value.id,
    })
    await sdk.enrollPersonInCourse({
      organizationId,
      courseId: course.value.id,
      personId: teacher.value.id,
    })

    const students = await sdk.listCourseStudents({
      organizationId,
      courseId: course.value.id,
    })
    const people = await sdk.listCoursePeople({
      organizationId,
      courseId: course.value.id,
    })
    expect(students.ok && people.ok).toBe(true)
    if (!students.ok || !people.ok) return
    expect(students.value).toHaveLength(1)
    expect(students.value[0]?.id).toBe(student.value.id)
    expect(people.value.map((person) => person.id).sort()).toEqual(
      [student.value.id, teacher.value.id].sort(),
    )
  })

  it('returns an empty student list when the course has no students', async () => {
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

    const students = await sdk.listCourseStudents({
      organizationId,
      courseId: course.value.id,
    })
    expect(students.ok).toBe(true)
    if (!students.ok) return
    expect(students.value).toEqual([])
  })

  it('rejects invalid identifiers and missing organizations or courses', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const course = await sdk.createCourse({
      organizationId: created.value.organization.id,
      ...courseInput,
    })
    expect(course.ok).toBe(true)
    if (!course.ok) return

    const invalidOrg = await sdk.listCourses({ organizationId: 'no-uuid' })
    const invalidCourse = await sdk.getCourse({
      organizationId: created.value.organization.id,
      courseId: 'no-uuid',
    })
    const missingOrg = await sdk.listCourses({
      organizationId: '00000000-0000-4000-8000-000000000001',
    })
    const missingCourse = await sdk.listCourseStudents({
      organizationId: created.value.organization.id,
      courseId: '00000000-0000-4000-8000-000000000002',
    })

    expect(invalidOrg.ok).toBe(false)
    expect(invalidCourse.ok).toBe(false)
    expect(missingOrg.ok).toBe(false)
    expect(missingCourse.ok).toBe(false)
    if (
      invalidOrg.ok ||
      invalidCourse.ok ||
      missingOrg.ok ||
      missingCourse.ok
    ) {
      return
    }
    expect(invalidOrg.error.code).toBe('VALIDATION')
    expect(invalidCourse.error.code).toBe('VALIDATION')
    expect(missingOrg.error.code).toBe('NOT_FOUND')
    expect(missingCourse.error.code).toBe('NOT_FOUND')
  })
})
