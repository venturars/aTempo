import { createCourse } from '../src/course/create-course'
import { deleteCourse } from '../src/course/delete-course'
import { updateCourse } from '../src/course/update-course'
import { createOrganization } from '../src/organization/create-organization'
import { deleteOrganization } from '../src/organization/delete-organization'
import { updateOrganization } from '../src/organization/update-organization'
import { addPersonCourse } from '../src/person-course/add-person-course'
import { removePersonCourse } from '../src/person-course/remove-person-course'
import { createPerson } from '../src/person/create-person'
import { deletePerson } from '../src/person/delete-person'
import { updatePerson } from '../src/person/update-person'
import { addPersonRole } from '../src/person-role/add-person-role'
import { removePersonRole } from '../src/person-role/remove-person-role'
import type { CourseCreate } from '../src/types/course'
import type { OrganizationCreate } from '../src/types/organization'
import type { PersonCreate } from '../src/types/person'
import type { RoleName } from '../src/types/role'
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

describe('escrituras', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when create input is missing a field', async () => {
    const calls = mockDriver()
    await expect(
      createOrganization({
        organization: { name: 'Acme' } as OrganizationCreate,
      }),
    ).rejects.toThrow('organization.tax_id debe ser un string no vacío')
    await expect(
      createPerson({
        person: {
          email: validPerson.email,
          first_name: validPerson.first_name,
          last_name: validPerson.last_name,
          birth_date: validPerson.birth_date,
          phone: validPerson.phone,
        } as PersonCreate,
      }),
    ).rejects.toThrow('person.identification_document debe ser un string no vacío')
    await expect(
      createCourse({
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
      addPersonRole({
        personRole: { person_id: PERSON_ID, role: 'admin' as RoleName },
      }),
    ).rejects.toThrow(
      'person_role.role debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when a write id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(deleteOrganization({ id: 'no-es-uuid' })).rejects.toThrow(
      'organization.id debe ser un uuid',
    )
    await expect(deletePerson({ id: 'no-es-uuid' })).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    await expect(deleteCourse({ id: 'no-es-uuid' })).rejects.toThrow(
      'course.id debe ser un uuid',
    )
    await expect(
      removePersonCourse({ personId: 'no-es-uuid', courseId: COURSE_ID }),
    ).rejects.toThrow('person_course.person_id debe ser un uuid')
    await expect(
      removePersonRole({
        personId: PERSON_ID,
        roleName: 'admin' as RoleName,
      }),
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
      createOrganization({ organization: organizationCreate }),
    ).resolves.toEqual({ organization: validOrganization })
    await expect(createPerson({ person: personCreate })).resolves.toEqual({
      person: validPerson,
    })
    await expect(createCourse({ course: courseCreate })).resolves.toEqual({
      course: validCourse,
    })
    await expect(
      addPersonCourse({ personCourse: validPersonCourse }),
    ).resolves.toEqual({ personCourse: validPersonCourse })
    await expect(
      addPersonRole({ personRole: validPersonRole }),
    ).resolves.toEqual({ personRole: validPersonRole })
  })

  it('updates a row after assert and returns null when missing', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(
      updateOrganization({ organization: validOrganization }),
    ).resolves.toEqual({ organization: validOrganization })
    expect(calls.some((call) => call.sql.includes('UPDATE'))).toBe(true)

    mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return emptyResult()
    })
    await expect(
      updateOrganization({ organization: validOrganization }),
    ).resolves.toEqual({ organization: null })
    await expect(updatePerson({ person: validPerson })).resolves.toEqual({
      person: null,
    })
    await expect(updateCourse({ course: validCourse })).resolves.toEqual({
      course: null,
    })
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
      return emptyResult()
    })
    await expect(updatePerson({ person: validPerson })).resolves.toEqual({
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
      if (
        sql.includes('lower(contract_address)') ||
        sql.includes('acronym')
      ) {
        return rowsResult([{ id: validCourse.id }])
      }
      return emptyResult()
    })
    await expect(updateCourse({ course: validCourse })).resolves.toEqual({
      course: validCourse,
    })
    expect(calls.some((call) => call.sql.includes('UPDATE course'))).toBe(true)
  })

  it('deletes dependents before the parent row', async () => {
    const personCalls = mockDriver(async () => commandResult(1))
    await expect(deletePerson({ id: PERSON_ID })).resolves.toEqual({
      deleted: true,
    })
    expect(personCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'COMMIT',
    ])

    const courseCalls = mockDriver(async () => commandResult(1))
    await expect(deleteCourse({ id: COURSE_ID })).resolves.toEqual({
      deleted: true,
    })
    expect(courseCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM course WHERE'),
      'COMMIT',
    ])

    const orgCalls = mockDriver(async () => commandResult(1))
    await expect(deleteOrganization({ id: ORG_ID })).resolves.toEqual({
      deleted: true,
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
    await expect(deletePerson({ id: PERSON_ID })).rejects.toThrow('timeout')
    expect(personCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
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
    await expect(deleteOrganization({ id: ORG_ID })).rejects.toThrow('timeout')
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
    await expect(deletePerson({ id: PERSON_ID })).rejects.toThrow('timeout')
  })

  it('deletes by key and reports whether a row was removed', async () => {
    mockDriver(async () => commandResult(1))
    await expect(
      removePersonCourse({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).resolves.toEqual({ deleted: true })
    await expect(
      removePersonRole({ personId: PERSON_ID, roleName: 'teacher' }),
    ).resolves.toEqual({ deleted: true })

    mockDriver(async () => commandResult(0))
    await expect(deleteOrganization({ id: ORG_ID })).resolves.toEqual({
      deleted: false,
    })
    await expect(deletePerson({ id: PERSON_ID })).resolves.toEqual({
      deleted: false,
    })
    await expect(deleteCourse({ id: COURSE_ID })).resolves.toEqual({
      deleted: false,
    })
    await expect(
      removePersonCourse({ personId: PERSON_ID, courseId: COURSE_ID }),
    ).resolves.toEqual({ deleted: false })
    await expect(
      removePersonRole({ personId: PERSON_ID, roleName: 'teacher' }),
    ).resolves.toEqual({ deleted: false })
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
    await expect(addPersonRole({ personRole: student })).resolves.toEqual({
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
      addPersonCourse({ personCourse: validPersonCourse }),
    ).resolves.toEqual({ personCourse: validPersonCourse })
    expect(calls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('AS person_exists'),
      expect.stringContaining('INSERT INTO person_course'),
      'COMMIT',
    ])
  })
})
