import { getCourseById } from '../src/course/get-course-by-id'
import { listCourses } from '../src/course/list-courses'
import { getOrganizationById } from '../src/organization/get-organization-by-id'
import { listOrganizations } from '../src/organization/list-organizations'
import { listPersonCourses } from '../src/person-course/list-person-courses'
import { getPersonById } from '../src/person/get-person-by-id'
import { listPersons } from '../src/person/list-persons'
import { listPersonRoles } from '../src/person-role/list-person-roles'
import { getRoleByName } from '../src/role/get-role-by-name'
import { listRoles } from '../src/role/list-roles'
import type { RoleName } from '../src/types/role'
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
  validPersonCourse,
  validPersonRole,
} from './helpers'

describe('lecturas', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when the person id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(getPersonById({ id: 'no-es-uuid' })).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    expect(calls).toHaveLength(0)
  })

  it('returns null when the person does not exist', async () => {
    const calls = mockDriver(async () => emptyResult())
    await expect(getPersonById({ id: PERSON_ID })).resolves.toEqual({
      person: null,
    })
    expect(calls).toHaveLength(1)
  })

  it('returns a person after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(getPersonById({ id: PERSON_ID })).resolves.toEqual({
      person: validPerson,
    })
  })

  it('returns a person whose first_name is empty', async () => {
    const row = { ...validPerson, first_name: '' }
    mockDriver(async () => rowsResult([row]))
    await expect(getPersonById({ id: PERSON_ID })).resolves.toEqual({
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
    await expect(listPersons()).resolves.toEqual({
      persons: [{ ...validPerson, last_name: '' }],
    })
    await expect(listOrganizations()).resolves.toEqual({
      organizations: [{ ...validOrganization, name: '' }],
    })
    await expect(listCourses()).resolves.toEqual({
      courses: [{ ...validCourse, name: '', acronym: '' }],
    })
  })

  it('lists persons', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(listPersons()).resolves.toEqual({ persons: [validPerson] })
  })

  it('projects course timestamps as UTC ISO and birth_date as a calendar date', async () => {
    const calls = mockDriver(async () => emptyResult())
    await listCourses()
    await listPersons()
    expect(calls[0].sql).toContain('YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    expect(calls[1].sql).toContain("to_char(birth_date, 'YYYY-MM-DD')")
  })

  it('does not query when role name is invented', async () => {
    const calls = mockDriver()
    await expect(
      getRoleByName({ name: 'admin' as RoleName }),
    ).rejects.toThrow(
      'role.name debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('gets a role by name', async () => {
    mockDriver(async () => rowsResult([{ name: 'teacher' }]))
    await expect(getRoleByName({ name: 'teacher' })).resolves.toEqual({
      role: { name: 'teacher' },
    })
  })

  it('lists organizations, courses, roles and junctions', async () => {
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
      if (sql.includes('FROM person_course')) {
        return rowsResult([validPersonCourse])
      }
      if (sql.includes('FROM person_role')) {
        return rowsResult([validPersonRole])
      }
      return emptyResult()
    })

    await expect(listOrganizations()).resolves.toEqual({
      organizations: [validOrganization],
    })
    await expect(getOrganizationById({ id: ORG_ID })).resolves.toEqual({
      organization: validOrganization,
    })
    await expect(listCourses()).resolves.toEqual({ courses: [validCourse] })
    await expect(getCourseById({ id: COURSE_ID })).resolves.toEqual({
      course: validCourse,
    })
    await expect(listRoles()).resolves.toEqual({
      roles: [{ name: 'student' }],
    })
    await expect(listPersonCourses()).resolves.toEqual({
      personCourses: [validPersonCourse],
    })
    await expect(listPersonRoles()).resolves.toEqual({
      personRoles: [validPersonRole],
    })
  })
})
