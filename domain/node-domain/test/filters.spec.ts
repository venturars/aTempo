import { listCoursesByOrganization } from '../src/course/list-courses-by-organization'
import { listCoursesByPerson } from '../src/course/list-courses-by-person'
import { listPersonsByCourse } from '../src/person/list-persons-by-course'
import { listPersonsByRole } from '../src/person/list-persons-by-role'
import { listRolesByPerson } from '../src/role/list-roles-by-person'
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
    await expect(listCoursesByPerson('no-es-uuid')).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    await expect(listRolesByPerson('no-es-uuid')).rejects.toThrow(
      'person.id debe ser un uuid',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when the course id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(listPersonsByCourse('no-es-uuid')).rejects.toThrow(
      'course.id debe ser un uuid',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when the organization id is not a uuid', async () => {
    const calls = mockDriver()
    await expect(listCoursesByOrganization('no-es-uuid')).rejects.toThrow(
      'organization.id debe ser un uuid',
    )
    expect(calls).toHaveLength(0)
  })

  it('does not query when the role name is invented', async () => {
    const calls = mockDriver()
    await expect(listPersonsByRole('admin')).rejects.toThrow(
      'role.name debe ser organization_admin, teacher o student',
    )
    expect(calls).toHaveLength(0)
  })

  it('returns an empty list when there are no rows', async () => {
    mockDriver(async () => emptyResult())
    await expect(listCoursesByPerson(PERSON_ID)).resolves.toEqual([])
    await expect(listPersonsByCourse(COURSE_ID)).resolves.toEqual([])
    await expect(listRolesByPerson(PERSON_ID)).resolves.toEqual([])
    await expect(listPersonsByRole('teacher')).resolves.toEqual([])
    await expect(listCoursesByOrganization(ORG_ID)).resolves.toEqual([])
  })

  it('lists courses of a person after assert', async () => {
    const calls = mockDriver(async () => rowsResult([validCourse]))
    await expect(listCoursesByPerson(PERSON_ID)).resolves.toEqual([
      validCourse,
    ])
    expect(calls).toEqual([
      {
        sql: expect.stringContaining('FROM course'),
        params: [PERSON_ID],
      },
    ])
  })

  it('lists persons of a course after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(listPersonsByCourse(COURSE_ID)).resolves.toEqual([
      validPerson,
    ])
  })

  it('lists roles of a person after assert', async () => {
    mockDriver(async () => rowsResult([{ name: 'teacher' }]))
    await expect(listRolesByPerson(PERSON_ID)).resolves.toEqual([
      { name: 'teacher' },
    ])
  })

  it('lists persons with a role after assert', async () => {
    mockDriver(async () => rowsResult([validPerson]))
    await expect(listPersonsByRole('teacher')).resolves.toEqual([validPerson])
  })

  it('lists courses of an organization after assert', async () => {
    mockDriver(async () => rowsResult([validCourse]))
    await expect(listCoursesByOrganization(ORG_ID)).resolves.toEqual([
      validCourse,
    ])
  })
})
