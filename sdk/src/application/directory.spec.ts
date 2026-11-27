import { AppError } from '../shared/app-error'
import { createSdk } from '../composition/create-sdk'
import { fixedAssignedCourseCount } from '../domain/assigned-course-count'

const admin = {
  name: 'Neoland',
  taxId: 'b-87.654.321',
  firstName: 'Ventura',
  lastName: 'Rodríguez',
  identificationDocument: '12345678-a',
  email: '  Profesor@aTempo.TEST ',
}

const teacher = {
  firstName: 'Lucía',
  lastName: 'García',
  identificationDocument: '87654321B',
  email: 'lucia@neoland.example',
  role: 'teacher' as const,
}

describe('organization directory', () => {
  it('creates an organization and its admin without Auth0', async () => {
    const sdk = createSdk()

    const result = await sdk.createOrganization(admin)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.organization).toMatchObject({
      name: 'Neoland',
      taxId: 'B87654321',
    })
    expect(result.value.person).toMatchObject({
      email: 'profesor@atempo.test',
      identificationDocument: '12345678A',
      roles: ['organization_admin'],
      invitationStatus: 'active',
      organizationId: result.value.organization.id,
    })
    expect(sdk.persons.size()).toBe(1)
  })

  it('rejects duplicate tax_id, document or email without writing', async () => {
    const sdk = createSdk()
    const first = await sdk.createOrganization(admin)
    expect(first.ok).toBe(true)

    const tax = await sdk.createOrganization({
      ...admin,
      email: 'otro@atempo.test',
      identificationDocument: '11111111C',
    })
    const document = await sdk.createOrganization({
      ...admin,
      name: 'Otra',
      taxId: 'A12345678',
      email: 'otro@atempo.test',
    })
    const email = await sdk.createOrganization({
      ...admin,
      name: 'Otra',
      taxId: 'A12345678',
      identificationDocument: '11111111C',
    })

    expect(tax.ok).toBe(false)
    expect(document.ok).toBe(false)
    expect(email.ok).toBe(false)
    if (tax.ok || document.ok || email.ok) return
    expect(tax.error).toBeInstanceOf(AppError)
    expect(tax.error.code).toBe('CONFLICT')
    expect(document.error.code).toBe('CONFLICT')
    expect(email.error.code).toBe('CONFLICT')
    expect(sdk.persons.size()).toBe(1)
  })

  it('invites a teacher or student as pending and rejects another admin', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const organizationId = created.value.organization.id

    const invited = await sdk.invitePerson({ organizationId, ...teacher })
    const student = await sdk.invitePerson({
      organizationId,
      firstName: 'Ada',
      lastName: 'López',
      identificationDocument: '11223344C',
      email: 'ada.lopez@clase.test',
      birthDate: '',
      phone: '',
      role: 'student',
    })
    const adminInvite = await sdk.invitePerson({
      organizationId,
      ...teacher,
      email: 'otro@neoland.example',
      identificationDocument: '99887766D',
      role: 'organization_admin',
    })

    expect(invited.ok).toBe(true)
    expect(student.ok).toBe(true)
    expect(adminInvite.ok).toBe(false)
    if (!invited.ok || !student.ok || adminInvite.ok) return
    expect(invited.value.roles).toEqual(['teacher'])
    expect(invited.value.invitationStatus).toBe('pending')
    expect(student.value.roles).toEqual(['student'])
    expect(student.value.birthDate).toBeNull()
    expect(student.value.phone).toBeNull()
    expect(adminInvite.error.code).toBe('VALIDATION')
    const listed = await sdk.listPeople({ organizationId })
    expect(listed.ok).toBe(true)
    if (!listed.ok) return
    expect(listed.value).toHaveLength(3)
  })

  it('does not drop teacher or delete when AssignedCourseCount is N', async () => {
    const sdk = createSdk({
      assignedCourseCount: fixedAssignedCourseCount(2),
    })
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const invited = await sdk.invitePerson({
      organizationId: created.value.organization.id,
      ...teacher,
    })
    expect(invited.ok).toBe(true)
    if (!invited.ok) return

    const patched = await sdk.patchPerson({
      personId: invited.value.id,
      roles: [],
    })
    const deleted = await sdk.deletePerson({ personId: invited.value.id })

    expect(patched.ok).toBe(false)
    expect(deleted.ok).toBe(false)
    if (patched.ok || deleted.ok) return
    expect(patched.error.code).toBe('VALIDATION')
    expect(deleted.error.code).toBe('VALIDATION')
    expect(await sdk.persons.findById(invited.value.id)).toEqual(invited.value)
  })

  it('lets the admin also be a teacher and rejects that on a student', async () => {
    const sdk = createSdk()
    const created = await sdk.createOrganization(admin)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const student = await sdk.invitePerson({
      organizationId: created.value.organization.id,
      firstName: 'Ada',
      lastName: 'López',
      identificationDocument: '11223344C',
      email: 'ada.lopez@clase.test',
      role: 'student',
    })
    expect(student.ok).toBe(true)
    if (!student.ok) return

    const asTeacher = await sdk.patchPerson({
      personId: created.value.person.id,
      roles: ['organization_admin', 'teacher'],
    })
    const studentTeacher = await sdk.patchPerson({
      personId: student.value.id,
      roles: ['student', 'teacher'],
    })

    expect(asTeacher.ok).toBe(true)
    expect(studentTeacher.ok).toBe(false)
    if (!asTeacher.ok || studentTeacher.ok) return
    expect(asTeacher.value.roles).toEqual(['organization_admin', 'teacher'])
    expect(studentTeacher.error.code).toBe('VALIDATION')
  })

  it('rejects identifier outside 5-20 letters or digits without writing', async () => {
    const sdk = createSdk()
    const result = await sdk.createOrganization({
      ...admin,
      taxId: 'AB',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('VALIDATION')
    expect(sdk.persons.size()).toBe(0)
  })
})
