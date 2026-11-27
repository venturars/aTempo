import { NotFoundError, PersistenceError } from '@atempo/errors'
import { addCourse } from '../src/courses/add-course'
import { modifyCourse } from '../src/courses/modify-course'
import { removeCourse } from '../src/courses/remove-course'
import { enrollPerson } from '../src/enrollment/enroll-person'
import { unenrollPerson } from '../src/enrollment/unenroll-person'
import { registerOrganization } from '../src/organizations/register-organization'
import { modifyOrganization } from '../src/organizations/modify-organization'
import { removeOrganization } from '../src/organizations/remove-organization'
import { addPerson } from '../src/people/add-person'
import { modifyPerson } from '../src/people/modify-person'
import { removePerson } from '../src/people/remove-person'
import { assignRole } from '../src/roles/assign-role'
import { revokeRole } from '../src/roles/revoke-role'
import type { CourseCreate } from '../src/shared/types/course'
import type { OrganizationCreate } from '../src/shared/types/organization'
import type { PersonCreate } from '../src/shared/types/person'
import type { RoleName } from '../src/shared/types/role'
import {
  commandResult,
  COURSE_ID,
  emptyResult,
  lookupById,
  mockDriver,
  ORG_ID,
  PERSON_ID,
  resetDriver,
  rowsResult,
  validCourse,
  validOrganization,
  validPerson,
  validPersonCourse,
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

/** El DELETE con RETURNING devuelve la fila borrada; los demás, una fila. */
function deletedRow(sql: string) {
  if (sql.includes('DELETE FROM person WHERE')) {
    return rowsResult([validPerson])
  }
  if (sql.includes('DELETE FROM course WHERE')) {
    return rowsResult([validCourse])
  }
  if (sql.includes('DELETE FROM organization')) {
    return rowsResult([validOrganization])
  }
  if (sql.includes('DELETE FROM person_course') && sql.includes('RETURNING')) {
    return rowsResult([validPersonCourse])
  }
  if (sql.includes('DELETE FROM person_role') && sql.includes('RETURNING')) {
    return rowsResult([validPersonRole])
  }
  return commandResult(1)
}

describe('escrituras', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when create input is missing a field', async () => {
    const calls = mockDriver()
    await expect(
      registerOrganization({
        organization: { name: 'Acme' } as OrganizationCreate,
        admin: personCreate,
      }),
    ).rejects.toThrow('organization.tax_id debe ser un string no vacío')
    await expect(
      addPerson({
        person: {
          email: validPerson.email,
          first_name: validPerson.first_name,
          last_name: validPerson.last_name,
          birth_date: validPerson.birth_date,
          phone: validPerson.phone,
        } as PersonCreate,
      }),
    ).rejects.toThrow(
      'person.identification_document debe ser un string no vacío',
    )
    await expect(
      addCourse({
        course: {
          organization_id: ORG_ID,
          name: 'Primero',
          acronym: '1A',
          start_at: validCourse.start_at,
          end_at: validCourse.end_at,
        } as CourseCreate,
      }),
    ).rejects.toThrow('course.contract_address debe ser un string no vacío')
    expect(calls).toHaveLength(0)
  })

  it('does not query when the role is invented', async () => {
    const calls = mockDriver()
    await expect(
      assignRole({ personId: PERSON_ID, role: 'admin' as RoleName }),
    ).rejects.toThrow(
      'person_role.role debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when a write id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(removeOrganization({ id: 'no-es-uuid' })).rejects.toThrow(
      'organization.id debe ser un uuid',
    )
    await expect(removePerson({ id: 'no-es-uuid' })).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    await expect(removeCourse({ id: 'no-es-uuid' })).rejects.toThrow(
      'course.id debe ser un uuid',
    )
    await expect(
      unenrollPerson({ personId: 'no-es-uuid', courseId: COURSE_ID }),
    ).rejects.toThrow('person_course.person_id debe ser un uuid')
    await expect(
      revokeRole({ personId: PERSON_ID, role: 'admin' as RoleName }),
    ).rejects.toThrow(
      'person_role.role debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('creates organization, person, course and junctions', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO organization')) {
        return rowsResult([validOrganization])
      }
      if (sql.includes('INSERT INTO person_course')) {
        return rowsResult([validPersonCourse])
      }
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([validPersonRole])
      }
      if (sql.includes('INSERT INTO person')) {
        return rowsResult([validPerson])
      }
      if (sql.includes('INSERT INTO course')) {
        return rowsResult([validCourse])
      }
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return emptyResult()
    })

    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).resolves.toEqual({ organization: validOrganization, admin: validPerson })
    await expect(addPerson({ person: personCreate })).resolves.toEqual({
      person: validPerson,
    })
    await expect(addCourse({ course: courseCreate })).resolves.toEqual({
      course: validCourse,
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).resolves.toEqual({ personCourse: validPersonCourse })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'teacher' }),
    ).resolves.toEqual({ personRole: validPersonRole })
  })

  it('registers an organization with its admin in one transaction', async () => {
    const admin = { person_id: PERSON_ID, role: 'organization_admin' as const }
    const calls = mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO organization')) {
        return rowsResult([validOrganization])
      }
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([admin])
      }
      if (sql.includes('INSERT INTO person')) {
        return rowsResult([validPerson])
      }
      return emptyResult()
    })
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: { ...personCreate, email: '  Demo@ATEMPO.local ' },
      }),
    ).resolves.toEqual({ organization: validOrganization, admin: validPerson })
    const statements = calls.map((call) => call.sql)
    expect(statements[0]).toBe('BEGIN')
    expect(statements.at(-1)).toBe('COMMIT')
    const insertPerson = calls.find((call) =>
      call.sql.includes('INSERT INTO person ('),
    )
    expect(insertPerson?.params[1]).toBe('demo@atempo.local')
    const insertRole = calls.find((call) =>
      call.sql.includes('INSERT INTO person_role'),
    )
    expect(insertRole?.params).toEqual([PERSON_ID, 'organization_admin'])
  })

  it('does not register an organization when the admin email is taken', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(email)')) {
        return rowsResult([{ id: PERSON_ID }])
      }
      return emptyResult()
    })
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).rejects.toMatchObject({ id: 'person.email.taken' })
    expect(calls.some((call) => call.sql.includes('INSERT'))).toBe(false)
    expect(calls.at(-1)?.sql).toBe('ROLLBACK')
  })

  it('modifies a row in one transaction after assert', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(
      modifyOrganization({ id: ORG_ID, changes: { name: 'Acme' } }),
    ).resolves.toEqual({ organization: validOrganization })
    expect(calls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FROM organization'),
      expect.stringContaining('lower(tax_id)'),
      expect.stringContaining('UPDATE organization'),
      'COMMIT',
    ])
  })

  it('keeps the stored fields that are not in changes', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('UPDATE course')) {
        return rowsResult([{ ...validCourse, name: 'Segundo' }])
      }
      return lookupById(sql) ?? emptyResult()
    })
    await expect(
      modifyCourse({ id: COURSE_ID, changes: { name: 'Segundo' } }),
    ).resolves.toEqual({ course: { ...validCourse, name: 'Segundo' } })
    const update = calls.find((call) => call.sql.includes('UPDATE course'))
    expect(update?.params).toEqual([
      COURSE_ID,
      validCourse.organization_id,
      'Segundo',
      validCourse.acronym,
      validCourse.start_at,
      validCourse.end_at,
      validCourse.contract_address,
    ])
  })

  it('throws not found when the row to modify does not exist', async () => {
    const calls = mockDriver(async () => emptyResult())
    await expect(
      modifyOrganization({ id: ORG_ID, changes: { name: 'Acme' } }),
    ).rejects.toMatchObject({ id: 'organization.missing' })
    await expect(
      modifyPerson({ id: PERSON_ID, changes: { first_name: 'Ada' } }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      modifyCourse({ id: COURSE_ID, changes: { name: 'Primero' } }),
    ).rejects.toMatchObject({ id: 'course.missing' })
    expect(calls.some((call) => call.sql.includes('UPDATE'))).toBe(false)
  })

  it('throws instead of returning null when a write returns no row', async () => {
    mockDriver(async (sql) => lookupById(sql) ?? emptyResult())
    await expect(addCourse({ course: courseCreate })).rejects.toMatchObject({
      id: 'course.not_created',
      message: 'course no se ha creado',
    })
    await expect(
      registerOrganization({
        organization: organizationCreate,
        admin: personCreate,
      }),
    ).rejects.toBeInstanceOf(PersistenceError)
    await expect(addPerson({ person: personCreate })).rejects.toMatchObject({
      id: 'person.not_created',
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toMatchObject({ id: 'person_course.not_created' })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'teacher' }),
    ).rejects.toMatchObject({ id: 'person_role.not_created' })
    await expect(
      modifyCourse({ id: COURSE_ID, changes: { name: 'Primero' } }),
    ).rejects.toMatchObject({ id: 'course.not_updated' })
  })

  it('updates a person when uniqueness queries return the same id', async () => {
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
      modifyPerson({ id: PERSON_ID, changes: { email: validPerson.email } }),
    ).resolves.toEqual({
      person: validPerson,
    })
    expect(calls.some((call) => call.sql.includes('UPDATE person'))).toBe(true)
  })

  it('updates a course when uniqueness queries return the same id', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('UPDATE course')) {
        return rowsResult([validCourse])
      }
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      if (sql.includes('lower(contract_address)') || sql.includes('acronym')) {
        return rowsResult([{ id: validCourse.id }])
      }
      return emptyResult()
    })
    await expect(
      modifyCourse({
        id: COURSE_ID,
        changes: { contract_address: validCourse.contract_address },
      }),
    ).resolves.toEqual({
      course: validCourse,
    })
    expect(calls.some((call) => call.sql.includes('UPDATE course'))).toBe(true)
  })

  it('deletes dependents before the parent row', async () => {
    const personCalls = mockDriver(async (sql) => deletedRow(sql))
    await expect(removePerson({ id: PERSON_ID })).resolves.toEqual({
      person: validPerson,
    })
    expect(personCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FROM role'),
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'COMMIT',
    ])

    const courseCalls = mockDriver(async (sql) => deletedRow(sql))
    await expect(removeCourse({ id: COURSE_ID })).resolves.toEqual({
      course: validCourse,
    })
    expect(courseCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM course WHERE'),
      'COMMIT',
    ])

    const orgCalls = mockDriver(async (sql) => deletedRow(sql))
    await expect(removeOrganization({ id: ORG_ID })).resolves.toEqual({
      organization: validOrganization,
    })
    expect(orgCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM course WHERE'),
      expect.stringContaining('DELETE FROM organization'),
      'COMMIT',
    ])
  })

  it('rolls back a delete when the last statement fails', async () => {
    const personCalls = mockDriver(async (sql) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        throw new Error('timeout')
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({ message: 'timeout' }),
    })
    expect(personCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FROM role'),
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'ROLLBACK',
    ])

    const orgCalls = mockDriver(async (sql) => {
      if (sql.includes('DELETE FROM organization')) {
        throw new Error('timeout')
      }
      return commandResult(1)
    })
    await expect(removeOrganization({ id: ORG_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({ message: 'timeout' }),
    })
    expect(orgCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM course WHERE'),
      expect.stringContaining('DELETE FROM organization'),
      'ROLLBACK',
    ])
  })

  it('keeps the original error when ROLLBACK fails', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('DELETE FROM person WHERE')) {
        throw new Error('timeout')
      }
      if (sql === 'ROLLBACK') {
        throw new Error('rollback failed')
      }
      return commandResult(1)
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'postgres.unmapped',
      cause: expect.objectContaining({ message: 'timeout' }),
    })
  })

  it('deletes by key and returns the removed row', async () => {
    mockDriver(async (sql) => deletedRow(sql))
    await expect(
      unenrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).resolves.toEqual({ personCourse: validPersonCourse })
    await expect(
      revokeRole({ personId: PERSON_ID, role: 'teacher' }),
    ).resolves.toEqual({ personRole: validPersonRole })
  })

  it('throws not found when there is nothing to delete', async () => {
    const calls = mockDriver(async () => commandResult(0))
    await expect(removeOrganization({ id: ORG_ID })).rejects.toMatchObject({
      id: 'organization.missing',
    })
    await expect(removePerson({ id: PERSON_ID })).rejects.toMatchObject({
      id: 'person.missing',
    })
    await expect(removeCourse({ id: COURSE_ID })).rejects.toBeInstanceOf(
      NotFoundError,
    )
    await expect(
      unenrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).rejects.toMatchObject({
      id: 'person_course.missing',
      message: 'person_course no existe',
    })
    await expect(
      revokeRole({ personId: PERSON_ID, role: 'teacher' }),
    ).rejects.toMatchObject({ id: 'person_role.missing' })
    // Los borrados en transacción no dejan nada a medias.
    expect(calls.filter((call) => call.sql === 'COMMIT')).toHaveLength(0)
  })

  it('adds student when the person has no roles', async () => {
    const student = { person_id: PERSON_ID, role: 'student' as const }
    mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([student])
      }
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return emptyResult()
    })
    await expect(
      assignRole({ personId: PERSON_ID, role: 'student' }),
    ).resolves.toEqual({
      personRole: student,
    })
  })

  it('adds a course enrollment in one transaction', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO person_course')) {
        return rowsResult([validPersonCourse])
      }
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return emptyResult()
    })
    await expect(
      enrollPerson({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).resolves.toEqual({ personCourse: validPersonCourse })
    expect(calls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('AS person_exists'),
      expect.stringContaining('INSERT INTO person_course'),
      'COMMIT',
    ])
  })
})
