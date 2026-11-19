import { createCourse } from '../src/course/create-course'
import { updateCourse } from '../src/course/update-course'
import { createOrganization } from '../src/organization/create-organization'
import { updateOrganization } from '../src/organization/update-organization'
import { createPerson } from '../src/person/create-person'
import { addPersonRole } from '../src/person-role/add-person-role'
import {
  emptyResult,
  mockDriver,
  OTHER_ID,
  PERSON_ID,
  resetDriver,
  rowsResult,
  validCourse,
  validOrganization,
  validPerson,
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
      createCourse({
        ...courseInput,
        start_at: validCourse.end_at,
        end_at: validCourse.start_at,
      }),
    ).rejects.toThrow('course.end_at debe ser posterior a course.start_at')
    await expect(
      createCourse({ ...courseInput, contract_address: '0x123' }),
    ).rejects.toThrow('course.contract_address debe ser 0x y 40 hex')
    expect(calls).toHaveLength(0)
  })

  it('does not insert when tax_id already exists', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(createOrganization(organizationInput)).rejects.toThrow(
      'organization.tax_id ya existe',
    )
    expect(wrote(calls)).toBe(false)
    expect(calls).toHaveLength(1)
  })

  it('allows updating an organization that keeps its tax_id', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(updateOrganization(validOrganization)).resolves.toEqual(
      validOrganization,
    )
    expect(wrote(calls)).toBe(true)
  })

  it('does not update when tax_id belongs to another organization', async () => {
    const other = { ...validOrganization, id: OTHER_ID }
    const calls = mockDriver(async () => rowsResult([other]))
    await expect(updateOrganization(validOrganization)).rejects.toThrow(
      'organization.tax_id ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert when email or identification_document exists', async () => {
    const calls = mockDriver(async () => rowsResult([validPerson]))
    await expect(createPerson(personInput)).rejects.toThrow(
      'person.identification_document ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert when contract_address or acronym exists', async () => {
    const calls = mockDriver(async () => rowsResult([validCourse]))
    await expect(createCourse(courseInput)).rejects.toThrow(
      'course.contract_address ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not update when acronym belongs to another course', async () => {
    const other = { ...validCourse, id: OTHER_ID }
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(contract_address)')) {
        return rowsResult([validCourse])
      }
      return rowsResult([other])
    })
    await expect(updateCourse(validCourse)).rejects.toThrow(
      'course.acronym ya existe en la organización',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('treats emails that differ only by case as the same', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('WHERE identification_document')) {
        return emptyResult()
      }
      return rowsResult([validPerson])
    })
    await expect(
      createPerson({
        ...personInput,
        identification_document: '88888888X',
        email: '  Demo@ATEMPO.local ',
      }),
    ).rejects.toThrow('person.email ya existe')
    expect(wrote(calls)).toBe(false)
    expect(calls[1].params).toEqual(['demo@atempo.local'])
  })

  it('treats contract addresses that differ only by case as the same', async () => {
    const mixed = validCourse.contract_address.toUpperCase().replace('0X', '0x')
    const calls = mockDriver(async () => rowsResult([validCourse]))
    await expect(
      createCourse({ ...courseInput, contract_address: mixed }),
    ).rejects.toThrow('course.contract_address ya existe')
    expect(wrote(calls)).toBe(false)
    expect(calls[0].params).toEqual([validCourse.contract_address])
  })

  it('does not insert student when the person has another role', async () => {
    const calls = mockDriver(async () =>
      rowsResult([{ name: 'teacher' }]),
    )
    await expect(
      addPersonRole({ person_id: PERSON_ID, role: 'student' }),
    ).rejects.toThrow('un student no puede llevar otro rol')
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert another role when the person is student', async () => {
    const calls = mockDriver(async () => rowsResult([{ name: 'student' }]))
    await expect(
      addPersonRole({ person_id: PERSON_ID, role: 'teacher' }),
    ).rejects.toThrow('un student no puede llevar otro rol')
    expect(wrote(calls)).toBe(false)
  })

  it('allows teacher together with organization_admin', async () => {
    mockDriver(async (sql) => {
      if (sql.includes('INSERT INTO person_role')) {
        return rowsResult([validPersonRole])
      }
      return rowsResult([{ name: 'organization_admin' }])
    })
    await expect(addPersonRole(validPersonRole)).resolves.toEqual(
      validPersonRole,
    )
  })
})
