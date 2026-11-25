import { retrieveAllCoursesByOrganization } from '../src/course/retrieve-all-courses-by-organization'
import { retrieveAllCoursesByPerson } from '../src/course/retrieve-all-courses-by-person'
import { retrieveAllPersonsByCourse } from '../src/person/retrieve-all-persons-by-course'
import { retrieveAllPersonsByRole } from '../src/person/retrieve-all-persons-by-role'
import { retrieveAllRolesByPerson } from '../src/role/retrieve-all-roles-by-person'
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
  validPerson,
} from './helpers'

describe('listXByY', () => {
  afterEach(() => {
    resetDriver()
  })

  it('does not query when the person id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(
      retrieveAllCoursesByPerson({ personId: 'no-es-uuid' }),
    ).rejects.toThrow('person.id debe ser un uuid')
    await expect(
      retrieveAllRolesByPerson({ personId: 'no-es-uuid' }),
    ).rejects.toThrow('person.id debe ser un uuid')
    expect(calls).toHaveLength(0)
  })

  it('does not query when the course id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(
      retrieveAllPersonsByCourse({ courseId: 'no-es-uuid' }),
    ).rejects.toThrow('course.id debe ser un uuid')
    expect(calls).toHaveLength(0)
  })

  it('does not query when the organization id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(
      retrieveAllCoursesByOrganization({ organizationId: 'no-es-uuid' }),
    ).rejects.toThrow('organization.id debe ser un uuid')
    expect(calls).toHaveLength(0)
  })

  it('does not query when the role name is invented', async () => {
    const calls = mockDriver()
    await expect(
      retrieveAllPersonsByRole({ roleName: 'admin' as RoleName }),
    ).rejects.toThrow(
      'role.name debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('returns an empty list when there are no rows', async () => {
    mockDriver(async () => emptyResult())
    await expect(
      retrieveAllCoursesByPerson({ personId: PERSON_ID }),
    ).resolves.toEqual({ courses: [] })
    await expect(
      retrieveAllPersonsByCourse({ courseId: COURSE_ID }),
    ).resolves.toEqual({ persons: [] })
    await expect(
      retrieveAllRolesByPerson({ personId: PERSON_ID }),
    ).resolves.toEqual({ roles: [] })
    await expect(
      retrieveAllPersonsByRole({ roleName: 'teacher' }),
    ).resolves.toEqual({ persons: [] })
    await expect(
      retrieveAllCoursesByOrganization({ organizationId: ORG_ID }),
    ).resolves.toEqual({ courses: [] })
  })

  it('lists courses of a person after assert', async () => {
    const calls = mockDriver(async () => rowsResult([validCourse]))
    await expect(
      retrieveAllCoursesByPerson({ personId: PERSON_ID }),
    ).resolves.toEqual({ courses: [validCourse] })
    expect(calls).toEqual([
      {
        sql: expect.stringContaining('FROM course'),
        params: [PERSON_ID],
      },
    ])
  })

  it('lists persons of a course after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(
      retrieveAllPersonsByCourse({ courseId: COURSE_ID }),
    ).resolves.toEqual({ persons: [validPerson] })
  })

  it('lists roles of a person after assert', async () => {
    mockDriver(async () => rowsResult([{ name: 'teacher' }]))
    await expect(
      retrieveAllRolesByPerson({ personId: PERSON_ID }),
    ).resolves.toEqual({ roles: [{ name: 'teacher' }] })
  })

  it('lists persons with a role after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(
      retrieveAllPersonsByRole({ roleName: 'teacher' }),
    ).resolves.toEqual({ persons: [validPerson] })
  })

  it('lists courses of an organization after assert', async () => {
    mockDriver(async () => rowsResult([validCourse]))
    await expect(
      retrieveAllCoursesByOrganization({ organizationId: ORG_ID }),
    ).resolves.toEqual({ courses: [validCourse] })
  })
})
