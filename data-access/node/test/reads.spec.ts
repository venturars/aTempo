import { retrieveCourseById } from '../src/courses/retrieve-course-by-id'
import { retrieveAllCourses } from '../src/courses/retrieve-all-courses'
import { retrieveOrganizationById } from '../src/organizations/retrieve-organization-by-id'
import { retrieveAllOrganizations } from '../src/organizations/retrieve-all-organizations'
import { retrievePersonById } from '../src/people/retrieve-person-by-id'
import { retrieveAllPersons } from '../src/people/retrieve-all-persons'
import { retrieveAllRoles } from '../src/roles/retrieve-all-roles'
import {
  COURSE_ID,
  emptyResult,
  mockDriver,
  ORG_ID,
  PERSON_ID,
  resetDriver,
  rowsResult,
  validCourse,
  validOrganization,
  validPerson,
} from './helpers'

describe('lecturas', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when the person id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(retrievePersonById({ id: 'no-es-uuid' })).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    expect(calls).toHaveLength(0)
  })

  it('returns null when the person does not exist', async () => {
    const calls = mockDriver(async () => emptyResult())
    await expect(retrievePersonById({ id: PERSON_ID })).resolves.toEqual({
      person: null,
    })
    expect(calls).toHaveLength(1)
  })

  it('returns a person after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(retrievePersonById({ id: PERSON_ID })).resolves.toEqual({
      person: validPerson,
    })
  })

  it('returns a person whose first_name is empty', async () => {
    const row = { ...validPerson, first_name: '' }
    mockDriver(async () => rowsResult([row]))
    await expect(retrievePersonById({ id: PERSON_ID })).resolves.toEqual({
      person: row,
    })
  })

  it('lists rows whose labels are empty strings', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('FROM person')) {
        return rowsResult([{ ...validPerson, last_name: '' }])
      }
      if (sql.includes('FROM organization')) {
        return rowsResult([{ ...validOrganization, name: '' }])
      }
      if (sql.includes('FROM course')) {
        return rowsResult([{ ...validCourse, name: '', acronym: '' }])
      }
      return emptyResult()
    })
    await expect(retrieveAllPersons()).resolves.toEqual({
      persons: [{ ...validPerson, last_name: '' }],
    })
    await expect(retrieveAllOrganizations()).resolves.toEqual({
      organizations: [{ ...validOrganization, name: '' }],
    })
    await expect(retrieveAllCourses()).resolves.toEqual({
      courses: [{ ...validCourse, name: '', acronym: '' }],
    })
  })

  it('lists persons', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(retrieveAllPersons()).resolves.toEqual({
      persons: [validPerson],
    })
  })

  it('projects course timestamps as UTC ISO and birth_date as a calendar date', async () => {
    const calls = mockDriver(async () => emptyResult())
    await retrieveAllCourses()
    await retrieveAllPersons()
    expect(calls[0].sql).toContain('YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    expect(calls[1].sql).toContain("to_char(birth_date, 'YYYY-MM-DD')")
  })

  it('lists organizations, courses and roles', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('FROM organization')) {
        return rowsResult([validOrganization])
      }
      if (sql.includes('FROM course')) {
        return rowsResult([validCourse])
      }
      if (sql.includes('FROM role')) {
        return rowsResult([{ name: 'student' }])
      }
      return emptyResult()
    })

    await expect(retrieveAllOrganizations()).resolves.toEqual({
      organizations: [validOrganization],
    })
    await expect(retrieveOrganizationById({ id: ORG_ID })).resolves.toEqual({
      organization: validOrganization,
    })
    await expect(retrieveAllCourses()).resolves.toEqual({
      courses: [validCourse],
    })
    await expect(retrieveCourseById({ id: COURSE_ID })).resolves.toEqual({
      course: validCourse,
    })
    await expect(retrieveAllRoles()).resolves.toEqual({
      roles: [{ name: 'student' }],
    })
  })
})
