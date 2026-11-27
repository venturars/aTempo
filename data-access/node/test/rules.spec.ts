import { addCourse } from '../src/course/add-course'
import { updateCourse } from '../src/course/update-course'
import { ConflictError } from '@atempo/errors'
import { addOrganization } from '../src/organization/add-organization'
import { updateOrganization } from '../src/organization/update-organization'
import { addPerson } from '../src/person/add-person'
import { updatePerson } from '../src/person/update-person'
import { addPersonRole } from '../src/person-role/add-person-role'
import { addPersonCourse } from '../src/person-course/add-person-course'
import {
  emptyResult,
  enrollmentFlags,
  lookupById,
  mockDriver,
  OTHER_ID,
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
      addOrganization({ organization: organizationCreate }),
    ).rejects.toMatchObject({
      id: 'organization.tax_id.taken',
      message: 'organization.tax_id ya existe',
    })
    await expect(
      addOrganization({ organization: organizationCreate }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(wrote(calls)).toBe(false)
    expect(calls).toHaveLength(2)
  })

  it('treats a stored tax_id as taken even if the row would fail assert', async () => {
    const calls = mockDriver(async () =>
      rowsResult([{ id: validOrganization.id }]),
    )
    await expect(
      addOrganization({ organization: organizationCreate }),
    ).rejects.toThrow('organization.tax_id ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('allows updating an organization that keeps its tax_id', async () => {
    const calls = mockDriver(async () => rowsResult([validOrganization]))
    await expect(
      updateOrganization({ organization: validOrganization }),
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
      return emptyResult()
    })
    await expect(
      updatePerson({
        person: { ...validPerson, id: validPerson.id.toUpperCase() },
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
      updateOrganization({ organization: validOrganization }),
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
    await expect(updateCourse({ course: validCourse })).rejects.toThrow(
      'course.acronym ya existe en la organización',
    )
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
      addOrganization({
        organization: {
          ...organizationCreate,
          tax_id: validOrganization.tax_id.toLowerCase(),
        },
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
      return emptyResult()
    })
    await expect(updatePerson({ person: validPerson })).rejects.toThrow(
      'person.email ya existe',
    )
    expect(wrote(calls)).toBe(false)
  })

  it('does not update when identification_document belongs to another person', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('lower(identification_document)')) {
        return rowsResult([{ id: OTHER_ID }])
      }
      return emptyResult()
    })
    await expect(updatePerson({ person: validPerson })).rejects.toThrow(
      'person.identification_document ya existe',
    )
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
    await expect(updateCourse({ course: validCourse })).rejects.toThrow(
      'course.contract_address ya existe',
    )
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
      addPersonRole({
        personRole: { person_id: PERSON_ID, role: 'student' },
      }),
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
      addPersonRole({
        personRole: { person_id: PERSON_ID, role: 'teacher' },
      }),
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
      addPersonRole({ personRole: validPersonRole }),
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
      addPersonCourse({ personCourse: validPersonCourse }),
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
      addPersonCourse({ personCourse: validPersonCourse }),
    ).rejects.toThrow('course no existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not insert a repeated course enrollment', async () => {
    const calls = mockDriver(async (sql) => {
      if (sql.includes('AS person_exists')) {
        return enrollmentFlags({ already: true })
      }
      return emptyResult()
    })
    await expect(
      addPersonCourse({ personCourse: validPersonCourse }),
    ).rejects.toThrow('person_course ya existe')
    expect(wrote(calls)).toBe(false)
  })

  it('does not query when first_name is empty on update', async () => {
    const calls = mockDriver()
    await expect(
      updatePerson({ person: { ...validPerson, first_name: '' } }),
    ).rejects.toThrow('person.first_name debe ser un string no vacío')
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
      addPersonRole({ personRole: validPersonRole }),
    ).rejects.toThrow('person_role ya existe')
    expect(wrote(calls)).toBe(false)
  })
})
