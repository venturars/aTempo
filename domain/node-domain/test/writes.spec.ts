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

const organizationInput = {
  name: validOrganization.name,
  tax_id: validOrganization.tax_id,
}
const personInput = {
  identification_document: validPerson.identification_document,
  email: validPerson.email,
  first_name: validPerson.first_name,
  last_name: validPerson.last_name,
  birth_date: validPerson.birth_date,
  phone: validPerson.phone,
}
const courseInput = {
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
    await expect(createOrganization({ name: 'Acme' })).rejects.toThrow(
      'organization.tax_id debe ser un string no vacío',
    )
    await expect(
      createPerson({
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      }),
    ).rejects.toThrow('person.identification_document debe ser un string no vacío')
    await expect(
      createCourse({
        organization_id: ORG_ID,
        name: 'Primero',
        acronym: '1A',
        start_at: validCourse.start_at,
        end_at: validCourse.end_at,
      }),
    ).rejects.toThrow('course.contract_address debe ser un string no vacío')
    expect(calls).toHaveLength(0)
  })

  it('does not query when the role is invented', async () => {
    const calls = mockDriver()
    await expect(
      addPersonRole({ person_id: PERSON_ID, role: 'admin' }),
    ).rejects.toThrow(
      'person_role.role debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when a write id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(deleteOrganization('no-es-uuid')).rejects.toThrow(
      'organization.id debe ser un uuid',
    )
    await expect(deletePerson('no-es-uuid')).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    await expect(deleteCourse('no-es-uuid')).rejects.toThrow(
      'course.id debe ser un uuid',
    )
    await expect(removePersonCourse('no-es-uuid', COURSE_ID)).rejects.toThrow(
      'person_course.person_id debe ser un uuid',
    )
    await expect(removePersonRole(PERSON_ID, 'admin')).rejects.toThrow(
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

    await expect(createOrganization(organizationInput)).resolves.toEqual(
      validOrganization,
    )
    await expect(createPerson(personInput)).resolves.toEqual(validPerson)
    await expect(createCourse(courseInput)).resolves.toEqual(validCourse)
    await expect(addPersonCourse(validPersonCourse)).resolves.toEqual(
      validPersonCourse,
    )
    await expect(addPersonRole(validPersonRole)).resolves.toEqual(
      validPersonRole,
    )
  })

  it('updates a row after assert and returns null when missing', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(updateOrganization(validOrganization)).resolves.toEqual(
      validOrganization,
    )
    expect(calls.some((call) => call.sql.includes('UPDATE'))).toBe(true)

    mockDriver(async (sql) => {
      const existing = lookupById(sql)
      if (existing) {
        return existing
      }
      return emptyResult()
    })
    await expect(updateOrganization(validOrganization)).resolves.toBeNull()
    await expect(updatePerson(validPerson)).resolves.toBeNull()
    await expect(updateCourse(validCourse)).resolves.toBeNull()
  })

  it('deletes dependents before the parent row', async () => {
    const personCalls = mockDriver(async () => commandResult(1))
    await expect(deletePerson(PERSON_ID)).resolves.toBe(true)
    expect(personCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_role'),
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM person WHERE'),
      'COMMIT',
    ])

    const courseCalls = mockDriver(async () => commandResult(1))
    await expect(deleteCourse(COURSE_ID)).resolves.toBe(true)
    expect(courseCalls.map((call) => call.sql)).toEqual([
      'BEGIN',
      expect.stringContaining('DELETE FROM person_course'),
      expect.stringContaining('DELETE FROM course WHERE'),
      'COMMIT',
    ])

    const orgCalls = mockDriver(async () => commandResult(1))
    await expect(deleteOrganization(ORG_ID)).resolves.toBe(true)
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
    await expect(deletePerson(PERSON_ID)).rejects.toThrow('timeout')
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
    await expect(deleteOrganization(ORG_ID)).rejects.toThrow('timeout')
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
    await expect(deletePerson(PERSON_ID)).rejects.toThrow('timeout')
  })

  it('deletes by key and reports whether a row was removed', async () => {
    mockDriver(async () => commandResult(1))
    await expect(removePersonCourse(PERSON_ID, COURSE_ID)).resolves.toBe(true)
    await expect(removePersonRole(PERSON_ID, 'teacher')).resolves.toBe(true)

    mockDriver(async () => commandResult(0))
    await expect(deleteOrganization(ORG_ID)).resolves.toBe(false)
    await expect(deletePerson(PERSON_ID)).resolves.toBe(false)
    await expect(deleteCourse(COURSE_ID)).resolves.toBe(false)
    await expect(removePersonCourse(PERSON_ID, COURSE_ID)).resolves.toBe(false)
  })
})
