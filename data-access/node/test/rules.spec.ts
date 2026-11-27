import { ConflictError, NotFoundError, ValidationError } from '@atempo/errors'
import { addCourse } from '../src/courses/add-course'
import { modifyCourse } from '../src/courses/modify-course'
import { enrollPerson } from '../src/enrollment/enroll-person'
import { registerOrganization } from '../src/organizations/register-organization'
import { modifyOrganization } from '../src/organizations/modify-organization'
import { addPerson } from '../src/people/add-person'
import { modifyPerson } from '../src/people/modify-person'
import { removePerson } from '../src/people/remove-person'
import { assignRole } from '../src/roles/assign-role'
import { changeRole } from '../src/roles/change-role'
import { revokeRole } from '../src/roles/revoke-role'
import type { RoleName } from '../src/shared/types/role'
import {
  commandResult,
  COURSE_ID,
  emptyResult,
  enrollmentFlags,
  lookupById,
  mockDriver,
  ORG_ID,
  OTHER_ID,
  PERSON_ID,
  resetDriver,
  rowsResult,
  validCourse,
  validOrganization,
  validPerson,
  validPersonRole,
} from './helpers'

const organizationCreate = {
  name: validOrganization.name,
  tax_id: validOrganization.tax_id,
}
const personCreate = {
  identification_document: validPerson.identification_document,
  email: validPerson.email,
  first_name: validPerson.first_name,
  last_name: validPerson.last_name,
  birth_date: validPerson.birth_date,
  phone: validPerson.phone,
}
const courseCreate = {
  organization_id: validCourse.organization_id,
  name: validCourse.name,
  acronym: validCourse.acronym,
  start_at: validCourse.start_at,
  end_at: validCourse.end_at,
  contract_address: validCourse.contract_address,
}

function wrote(calls: { sql: string }[]): boolean {
  return calls.some((call) => /INSERT|UPDATE/.test(call.sql))
}

describe('reglas de negocio', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when course dates or address fail', async () => {
    const calls = mockDriver()
    await expect(
      addCourse({
        course: {
          ...courseCreate,
          start_at: validCourse.end_at,
          end_at: validCourse.start_at,
        },
      }),
    ).rejects.toThrow('course.end_at debe ser posterior a course.start_at')
    await expect(
      addCourse({
        course: { ...courseCreate, contract_address: '0x123' },
      }),
    ).rejects.toThrow('course.contract_address debe ser 0x y 40 hex')
    await expect(
      addCourse({
        course: { ...courseCreate, start_at: '2026-09-01T08:00' },
      }),
    ).rejects.toThrow('course.start_at debe ser una fecha con zona horaria')
    await expect(
      addCourse({
        course: {
          ...courseCreate,
          start_at: '2026-02-30T08:00:00.000Z',
        },
      }),
    ).rejects.toThrow(/^course\.start_at debe ser una fecha$/)
    expect(calls).toHaveLength(0)
  })

  it('does not insert when tax_id already exists', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).rejects.toMatchObject({
      id: 'organization.tax_id.taken',
      message: 'organization.tax_id ya existe',
    })
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(wrote(calls)).toBe(false)
    expect(
      calls.filter((call) => call.sql.includes('lower(tax_id)')),
    ).toHaveLength(2)
  })

  it('treats a stored tax_id as taken even if the row would fail assert', async () => {
    const calls = mockDriver(async () =>
      rowsResult([{ id: validOrganization.id }]),
    )
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).rejects.toThrow('organization.tax_id ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('allows updating an organization that keeps its tax_id', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(
      modifyOrganization({
        id: ORG_ID,
        changes: { tax_id: validOrganization.tax_id },
      }),
    ).resolves.toEqual({ organization: validOrganization })
    expect(wrote(calls)).toBe(true)
  })

  it('allows updating a person that keeps its email when the id differs only by case', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('UPDATE person')) {
        return rowsResult([validPerson])
      }
      if (
        sql.includes('FROM person') &&
        (sql.includes('lower(identification_document)') ||
          sql.includes('lower(email)'))
      ) {
        return rowsResult([{ id: validPerson.id }])
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      modifyPerson({
        id: validPerson.id.toUpperCase(),
        changes: { email: validPerson.email },
      }),
    ).resolves.toEqual({ person: validPerson })
    const update = calls.find((call) => call.sql.includes('UPDATE person'))
    expect(update?.params[0]).toBe(validPerson.id)
    expect(update?.sql).toContain('WHERE id = $1::uuid')
    expect(update?.sql).toContain('RETURNING')
  })

  it('does not update when tax_id belongs to another organization', async () => {
    const other = { ...validOrganization, id: OTHER_ID }
    const calls = mockDriver(async () => rowsResult([other]))
    await expect(
      modifyOrganization({
        id: ORG_ID,
        changes: { tax_id: validOrganization.tax_id },
      }),
    ).rejects.toThrow('organization.tax_id ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert when identification_document exists', async () => {
    const calls = mockDriver(async () => rowsResult([validPerson]))
    await expect(addPerson({ person: personCreate })).rejects.toThrow(
      'person.identification_document ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert when contract_address already exists', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return rowsResult([validCourse])
    })
    await expect(addCourse({ course: courseCreate })).rejects.toThrow(
      'course.contract_address ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert when acronym already exists on create', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('lower(contract_address)')) {
        return emptyResult()
      }
      return rowsResult([validCourse])
    })
    await expect(addCourse({ course: courseCreate })).rejects.toThrow(
      'course.acronym ya existe en la organización',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not update when acronym belongs to another course', async () => {
    const other = { ...validCourse, id: OTHER_ID }
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('lower(contract_address)')) {
        return rowsResult([validCourse])
      }
      return rowsResult([other])
    })
    await expect(
      modifyCourse({
        id: COURSE_ID,
        changes: { acronym: validCourse.acronym },
      }),
    ).rejects.toThrow('course.acronym ya existe en la organización')
    expect(wrote(calls)).toBe(false)
  })

  it('treats identification documents that differ only by case as the same', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(identification_document)')) {
        return rowsResult([{ id: validPerson.id }])
      }
      return emptyResult()
    })
    await expect(
      addPerson({
        person: {
          ...personCreate,
          identification_document:
            validPerson.identification_document.toLowerCase(),
        },
      }),
    ).rejects.toThrow('person.identification_document ya existe')
    expect(wrote(calls)).toBe(false)
    expect(
      calls.find((call) => call.sql.includes('lower(identification_document)'))
        ?.params,
    ).toEqual([validPerson.identification_document.toLowerCase()])
  })

  it('treats tax ids that differ only by case as the same', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(tax_id)')) {
        return rowsResult([{ id: validOrganization.id }])
      }
      return emptyResult()
    })
    await expect(
      registerOrganization({
        organization: {
          ...organizationCreate,
          tax_id: validOrganization.tax_id.toLowerCase(),
        },
        admin: personCreate,
      }),
    ).rejects.toThrow('organization.tax_id ya existe')
    expect(wrote(calls)).toBe(false)
    expect(
      calls.find((call) => call.sql.includes('lower(tax_id)'))?.params,
    ).toEqual([validOrganization.tax_id.toLowerCase()])
  })

  it('does not update when email belongs to another person', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(email)')) {
        return rowsResult([{ id: OTHER_ID }])
      }
      if (sql.includes('lower(identification_document)')) {
        return rowsResult([{ id: validPerson.id }])
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      modifyPerson({ id: PERSON_ID, changes: { email: validPerson.email } }),
    ).rejects.toThrow('person.email ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not update when identification_document belongs to another person', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(identification_document)')) {
        return rowsResult([{ id: OTHER_ID }])
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      modifyPerson({
        id: PERSON_ID,
        changes: { identification_document: '88888888X' },
      }),
    ).rejects.toThrow('person.identification_document ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not update when contract_address belongs to another course', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('lower(contract_address)')) {
        return rowsResult([{ id: OTHER_ID }])
      }
      if (sql.includes('acronym')) {
        return rowsResult([{ id: validCourse.id }])
      }
      return emptyResult()
    })
    await expect(
      modifyCourse({
        id: COURSE_ID,
        changes: { acronym: validCourse.acronym },
      }),
    ).rejects.toThrow('course.contract_address ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('treats emails that differ only by case as the same', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(identification_document)')) {
        return emptyResult()
      }
      return rowsResult([validPerson])
    })
    await expect(
      addPerson({
        person: {
          ...personCreate,
          identification_document: '88888888X',
          email: '  Demo@ATEMPO.local ',
        },
      }),
    ).rejects.toThrow('person.email ya existe')
    expect(wrote(calls)).toBe(false)
    expect(calls[1].params).toEqual(['demo@atempo.local'])
  })

  it('treats contract addresses that differ only by case as the same', async () => {
    const mixed = validCourse.contract_address.toUpperCase().replace('0X', '0x')
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return rowsResult([validCourse])
    })
    await expect(
      addCourse({
        course: { ...courseCreate, contract_address: mixed },
      }),
    ).rejects.toThrow('course.contract_address ya existe')
    expect(wrote(calls)).toBe(false)
    expect(
      calls.find((call) => call.sql.includes('lower(contract_address)'))
        ?.params,
    ).toEqual([validCourse.contract_address])
  })

  it('does not insert student when the person has another role', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return rowsResult([{ name: 'teacher' }])
    })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'student' }),
    ).rejects.toMatchObject({
      id: 'person_role.student.exclusive',
      message: 'un student no puede llevar otro rol',
    })
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert another role when the person is student', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return rowsResult([{ name: 'student' }])
    })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'teacher' }),
    ).rejects.toThrow('un student no puede llevar otro rol')
    expect(wrote(calls)).toBe(false)
  })

  it('allows teacher together with organization_admin', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([validPersonRole])
      }
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('FROM person_role')) {
        return emptyResult()
      }
      return rowsResult([{ name: 'organization_admin' }])
    })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'teacher' }),
    ).resolves.toEqual({ personRole: validPersonRole })
  })

  it('does not query when birth_date is not a calendar date', async () => {
    const calls = mockDriver()
    await expect(
      addPerson({
        person: { ...personCreate, birth_date: '2026-13-40' },
      }),
    ).rejects.toThrow('person.birth_date debe ser una fecha')
    await expect(
      addPerson({ person: { ...personCreate, birth_date: 'ayer' } }),
    ).rejects.toThrow('person.birth_date debe ser una fecha')
    expect(calls).toHaveLength(0)
  })

  it('does not insert when the organization does not exist', async () => {
    const calls = mockDriver(async () => emptyResult())
    await expect(addCourse({ course: courseCreate })).rejects.toThrow(
      'organization no existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert a course enrollment when the person does not exist', async () => {
    const calls = mockDriver(async () => emptyResult())
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toMatchObject({ id: 'person.missing' })
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert a course enrollment when the course does not exist', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS person_exists')) {
        return enrollmentFlags({ course_exists: false })
      }
      return emptyResult()
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toThrow('course no existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not enroll a person who is neither student nor teacher', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS person_exists')) {
        return enrollmentFlags({ has_course_role: false })
      }
      return emptyResult()
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toMatchObject({
      id: 'person_course.role_required',
      message: 'solo un student o un teacher se matricula en un curso',
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(wrote(calls)).toBe(false)
  })

  it('does not revoke the role of a person who is in a course', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS has_courses')) {
        return rowsResult([{ has_courses: true }])
      }
      return emptyResult()
    })
    await expect(
      revokeRole({ personId: PERSON_ID, role: 'teacher' }),
    ).rejects.toMatchObject({ id: 'person_role.role.enrolled' })
    expect(calls.map((call) => call.sql)).not.toContainEqual(
      expect.stringContaining('DELETE'),
    )
  })

  it('does not assign or revoke organization_admin', async () => {
    const calls = mockDriver(async () => commandResult(1))
    await expect(
      assignRole({ personId: PERSON_ID, role: 'organization_admin' }),
    ).rejects.toMatchObject({ id: 'person_role.role.protected' })
    await expect(
      revokeRole({ personId: PERSON_ID, role: 'organization_admin' }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(calls).toHaveLength(0)
  })

  it('does not remove the organization_admin', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('FROM role')) {
        return rowsResult([{ name: 'organization_admin' }, { name: 'teacher' }])
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'person.protected',
      message: 'el organization_admin no se puede borrar',
    })
    expect(calls.map((call) => call.sql)).not.toContainEqual(
      expect.stringContaining('DELETE'),
    )
  })

  it('does not remove a teacher who is in a course', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('FROM role')) {
        return rowsResult([{ name: 'teacher' }])
      }
      if (sql.includes('AS has_courses')) {
        return rowsResult([{ has_courses: true }])
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'person.enrolled',
      message: 'un teacher con cursos no se puede borrar',
    })
    expect(calls.map((call) => call.sql)).not.toContainEqual(
      expect.stringContaining('DELETE'),
    )
  })

  it('removes a student together with their enrollments', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('FROM role')) {
        return rowsResult([{ name: 'student' }])
      }
      if (sql.includes('DELETE FROM person WHERE')) {
        return rowsResult([validPerson])
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).resolves.toEqual({
      person: validPerson,
    })
    expect(calls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FROM role'),
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'COMMIT',
    ])
  })

  it('does not insert a repeated course enrollment', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS person_exists')) {
        return enrollmentFlags({ already: true })
      }
      return emptyResult()
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toThrow('person_course ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not write when first_name is emptied on modify', async () => {
    const calls = mockDriver(async (sql) => lookupById(sql) ?? emptyResult())
    await expect(
      modifyPerson({ id: PERSON_ID, changes: { first_name: '' } }),
    ).rejects.toThrow('person.first_name debe ser un string no vacío')
    expect(wrote(calls)).toBe(false)
  })

  it('checks course dates against the stored start_at on modify', async () => {
    const calls = mockDriver(async (sql) => lookupById(sql) ?? emptyResult())
    await expect(
      modifyCourse({
        id: COURSE_ID,
        changes: { end_at: '2026-08-01T08:00:00.000Z' },
      }),
    ).rejects.toMatchObject({ id: 'course.end_at.order' })
    expect(wrote(calls)).toBe(false)
  })

  it('does not query when modify changes are empty or unknown', async () => {
    const calls = mockDriver()
    await expect(
      modifyCourse({ id: COURSE_ID, changes: {} }),
    ).rejects.toMatchObject({ id: 'course.no_changes' })
    await expect(
      modifyPerson({
        id: PERSON_ID,
        changes: { id: OTHER_ID } as Record<string, string>,
      }),
    ).rejects.toMatchObject({ id: 'person.unknown_field' })
    await expect(
      modifyOrganization({ id: 'no-es-uuid', changes: { name: 'Acme' } }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(calls).toHaveLength(0)
  })

  it('does not insert a repeated role', async () => {
    const calls = mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('FROM role')) {
        return emptyResult()
      }
      return rowsResult([{ '?column?': 1 }])
    })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'teacher' }),
    ).rejects.toThrow('person_role ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not query when changeRole touches organization_admin or keeps the role', async () => {
    const calls = mockDriver()
    await expect(
      changeRole({
        personId: PERSON_ID,
        from: 'organization_admin',
        to: 'teacher',
      }),
    ).rejects.toMatchObject({
      id: 'person_role.role.protected',
      message:
        'organization_admin solo lo tiene quien registra la organización',
    })
    await expect(
      changeRole({
        personId: PERSON_ID,
        from: 'teacher',
        to: 'organization_admin',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      changeRole({ personId: PERSON_ID, from: 'teacher', to: 'teacher' }),
    ).rejects.toMatchObject({ id: 'person_role.role.unchanged' })
    await expect(
      changeRole({
        personId: PERSON_ID,
        from: 'teacher',
        to: 'admin' as RoleName,
      }),
    ).rejects.toMatchObject({ id: 'person_role.role.format' })
    expect(calls).toHaveLength(0)
  })

  it('does not change a role the person does not have', async () => {
    const calls = mockDriver(async (sql) => lookupById(sql) ?? emptyResult())
    await expect(
      changeRole({ personId: PERSON_ID, from: 'teacher', to: 'student' }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(wrote(calls)).toBe(false)
  })

  it('does not change the role of a person who is in a course', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS has_courses')) {
        return rowsResult([{ has_courses: true }])
      }
      if (sql.includes('FROM person_role')) {
        return rowsResult([{ '?column?': 1 }])
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      changeRole({ personId: PERSON_ID, from: 'student', to: 'teacher' }),
    ).rejects.toMatchObject({ id: 'person_role.role.enrolled' })
    expect(calls.map((call) => call.sql)).not.toContainEqual(
      expect.stringContaining('DELETE'),
    )
    expect(calls.at(-1)?.sql).toBe('ROLLBACK')
  })

  it('swaps student for teacher in one transaction', async () => {
    const teacher = { person_id: PERSON_ID, role: 'teacher' as const }
    let removed = false
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS has_courses')) {
        return rowsResult([{ has_courses: false }])
      }
      if (sql.includes('DELETE FROM person_role')) {
        removed = true
        return rowsResult([{ person_id: PERSON_ID, role: 'student' }])
      }
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([teacher])
      }
      if (sql.includes('SELECT 1') && sql.includes('FROM person_role')) {
        return removed ? emptyResult() : rowsResult([{ '?column?': 1 }])
      }
      if (sql.includes('FROM role')) {
        return emptyResult()
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      changeRole({ personId: PERSON_ID, from: 'student', to: 'teacher' }),
    ).resolves.toEqual({ personRole: teacher })
    const statements = calls.map((call) => call.sql)
    expect(statements[0]).toBe('BEGIN')
    expect(statements.at(-1)).toBe('COMMIT')
    const deleteAt = statements.findIndex((sql) =>
      sql.includes('DELETE FROM person_role'),
    )
    const insertAt = statements.findIndex((sql) =>
      sql.includes('INSERT INTO person_role'),
    )
    expect(deleteAt).toBeGreaterThan(0)
    expect(insertAt).toBeGreaterThan(deleteAt)
    expect(calls[deleteAt].params).toEqual([PERSON_ID, 'student'])
  })
})
