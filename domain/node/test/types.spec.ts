import { ValidationError } from '@atempo/errors'
import {
  assertNonEmptyString,
  assertString,
  normalizeUuid,
} from '../src/shared/validation/assert'
import {
  assertCourse,
  assertCourseCreate,
  normalizeContractAddress,
} from '../src/shared/validation/course'
import { courseFromRow } from '../src/postgres/rows/course'
import type { CourseCreate } from '../src/shared/types/course'
import {
  assertOrganization,
  assertOrganizationCreate,
} from '../src/shared/validation/organization'
import type { OrganizationCreate } from '../src/shared/types/organization'
import {
  assertPerson,
  assertPersonCreate,
  normalizeEmail,
} from '../src/shared/validation/person'
import { personFromRow } from '../src/postgres/rows/person'
import type { Person, PersonCreate } from '../src/shared/types/person'
import { assertPersonCourse } from '../src/shared/validation/person-course'
import { assertPersonRole } from '../src/shared/validation/person-role'
import { ROLE_NAMES, assertRole } from '../src/shared/validation/role'
import type { Role, RoleName } from '../src/shared/types/role'
import {
  validCourse,
  validOrganization,
  validPerson,
  validPersonCourse,
  validPersonRole,
} from './helpers'

describe('assert*', () => {
  it('normalizes email like the desktop login', () => {
    expect(normalizeEmail('  Ada.Lopez@Clase.TEST ')).toBe(
      'ada.lopez@clase.test',
    )
  })

  it('normalizes uuids to lowercase', () => {
    expect(normalizeUuid(validPerson.id.toUpperCase())).toBe(validPerson.id)
  })

  it('lowercases person, organization and course ids without mutating the input', () => {
    const personInput = { ...validPerson, id: validPerson.id.toUpperCase() }
    const person = assertPerson(personInput)
    expect(person.id).toBe(validPerson.id)
    expect(personInput.id).toBe(validPerson.id.toUpperCase())

    const organizationInput = {
      ...validOrganization,
      id: validOrganization.id.toUpperCase(),
    }
    const organization = assertOrganization(organizationInput)
    expect(organization.id).toBe(validOrganization.id)
    expect(organizationInput.id).toBe(validOrganization.id.toUpperCase())

    const courseInput = {
      ...validCourse,
      id: validCourse.id.toUpperCase(),
      organization_id: validCourse.organization_id.toUpperCase(),
    }
    const course = assertCourse(courseInput)
    expect(course.id).toBe(validCourse.id)
    expect(course.organization_id).toBe(validCourse.organization_id)
    expect(courseInput.id).toBe(validCourse.id.toUpperCase())
    expect(courseInput.organization_id).toBe(
      validCourse.organization_id.toUpperCase(),
    )
  })

  it('normalizes course instants to utc', () => {
    expect(
      assertCourseCreate({
        organization_id: validCourse.organization_id,
        name: validCourse.name,
        acronym: validCourse.acronym,
        start_at: '2026-09-01T08:00:00.000+01:00',
        end_at: '2026-09-01T10:00:00.000Z',
        contract_address: validCourse.contract_address,
      }).start_at,
    ).toBe('2026-09-01T07:00:00.000Z')
  })

  it('normalizes contract address to lowercase hex', () => {
    expect(
      normalizeContractAddress('0x5FBDB2315678AFECb367F032D93F642F64180AA3'),
    ).toBe('0x5fbdb2315678afecb367f032d93f642f64180aa3')
  })

  it('accepts a complete person', () => {
    expect(() => assertPerson(validPerson)).not.toThrow()
  })

  it('rejects an invalid birth_date', () => {
    expect(() =>
      assertPersonCreate({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: '2026-02-30',
        phone: validPerson.phone,
      }),
    ).toThrow('person.birth_date debe ser una fecha')
    expect(() =>
      assertPersonCreate({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: '0000-01-01',
        phone: validPerson.phone,
      }),
    ).toThrow('person.birth_date debe ser una fecha')
  })

  it('accepts a birth_date in year 0050', () => {
    expect(() =>
      assertPerson({ ...validPerson, birth_date: '0050-06-15' }),
    ).not.toThrow()
  })

  it('rejects empty names on write and keeps them on read', () => {
    expect(() =>
      assertPersonCreate({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: '',
        last_name: validPerson.last_name,
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      }),
    ).toThrow('person.first_name debe ser un string no vacío')
    expect(() =>
      assertPersonCreate({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: '',
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      }),
    ).toThrow('person.last_name debe ser un string no vacío')
    expect(assertPerson({ ...validPerson, first_name: '' }).first_name).toBe('')
    expect(assertPerson({ ...validPerson, last_name: '' }).last_name).toBe('')
    expect(assertOrganization({ ...validOrganization, name: '' }).name).toBe('')
    expect(
      assertOrganization({ ...validOrganization, tax_id: '' }).tax_id,
    ).toBe('')
    expect(assertCourse({ ...validCourse, name: '' }).name).toBe('')
    expect(assertCourse({ ...validCourse, acronym: '' }).acronym).toBe('')
    expect(() =>
      assertOrganizationCreate({ name: '', tax_id: validOrganization.tax_id }),
    ).toThrow('organization.name debe ser un string no vacío')
    expect(() => assertCourseCreate({ ...validCourse, name: '' })).toThrow(
      'course.name debe ser un string no vacío',
    )
  })

  it('rejects a person missing a field', () => {
    const incomplete = {
      id: validPerson.id,
      email: validPerson.email,
      first_name: validPerson.first_name,
      last_name: validPerson.last_name,
      birth_date: validPerson.birth_date,
      phone: validPerson.phone,
    } as Person
    expect(() => assertPerson(incomplete)).toThrow(
      'person.identification_document debe ser un string no vacío',
    )
  })

  it('rejects a create input missing a field', () => {
    expect(() =>
      assertOrganizationCreate({ name: 'Acme' } as OrganizationCreate),
    ).toThrow('organization.tax_id debe ser un string no vacío')
    expect(() =>
      assertPersonCreate({
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      } as PersonCreate),
    ).toThrow('person.identification_document debe ser un string no vacío')
    expect(() =>
      assertCourseCreate({
        organization_id: validCourse.organization_id,
        name: validCourse.name,
        acronym: validCourse.acronym,
        start_at: validCourse.start_at,
        end_at: validCourse.end_at,
      } as CourseCreate),
    ).toThrow('course.contract_address debe ser un string no vacío')
  })

  it('rejects a course with a bad contract address or dates', () => {
    expect(() =>
      assertCourse({ ...validCourse, contract_address: '0x123' }),
    ).toThrow('course.contract_address debe ser 0x y 40 hex')
    expect(() =>
      assertCourse({
        ...validCourse,
        start_at: validCourse.end_at,
        end_at: validCourse.start_at,
      }),
    ).toThrow('course.end_at debe ser posterior a course.start_at')
    expect(() =>
      assertCourse({ ...validCourse, start_at: '2026-09-01T08:00' }),
    ).toThrow('course.start_at debe ser una fecha con zona horaria')
    expect(() =>
      assertCourse({
        ...validCourse,
        start_at: '2026-02-30T08:00:00.000Z',
      }),
    ).toThrow(/^course\.start_at debe ser una fecha$/)
    expect(() =>
      assertCourse({
        ...validCourse,
        start_at: '0001-01-01T00:30:00.000+01:00',
        end_at: '0001-01-01T02:00:00.000Z',
      }),
    ).toThrow(/^course\.start_at debe ser una fecha$/)
    expect(() =>
      assertCourse({
        ...validCourse,
        start_at: '2026-01-01T10:00:00.0001Z',
        end_at: '2026-01-01T10:00:00.0009Z',
      }),
    ).toThrow('course.end_at debe ser posterior a course.start_at')
  })

  it('ROLE_NAMES lists every RoleName', () => {
    // Si un RoleName no está en ROLE_NAMES, MissingRoleName es ese nombre y
    // asignar `true` no compila: typecheck y ts-jest fallan.
    type MissingRoleName = Exclude<RoleName, (typeof ROLE_NAMES)[number]>
    const roleNamesCoverRoleName: [MissingRoleName] extends [never]
      ? true
      : MissingRoleName = true

    expect(roleNamesCoverRoleName).toBe(true)
  })

  it('rejects an invented role name', () => {
    expect(() => assertRole({ name: 'admin' as Role['name'] })).toThrow(
      'role.name debe ser organization_admin, teacher o student',
    )
  })

  it('throws ValidationError with a kind', () => {
    try {
      assertPersonCreate({
        ...validPerson,
        first_name: '',
      })
      throw new Error('expected ValidationError')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect(error).toMatchObject({
        id: 'person.first_name.empty',
        kind: 'VALIDATION',
        entity: 'person',
        field: 'first_name',
      })
    }
  })

  it('accepts organization, course and junctions', () => {
    expect(() => assertOrganization(validOrganization)).not.toThrow()
    expect(() => assertCourse(validCourse)).not.toThrow()
    expect(() => assertPersonCourse(validPersonCourse)).not.toThrow()
    expect(() => assertPersonRole(validPersonRole)).not.toThrow()
    expect(() => assertRole({ name: 'teacher' })).not.toThrow()
  })
})

describe('string validators', () => {
  it('assertString accepts an empty string and rejects other types', () => {
    expect(assertString('', 'course.name')).toBe('')
    expect(() => assertString(3, 'course.name')).toThrow(
      'course.name debe ser un string',
    )
  })

  it('assertNonEmptyString rejects the empty string', () => {
    expect(() => assertNonEmptyString('', 'course.name')).toThrow(
      'course.name debe ser un string no vacío',
    )
    expect(assertNonEmptyString('Taller', 'course.name')).toBe('Taller')
  })
})

describe('courseFromRow', () => {
  it('reads a stored date that the input would reject', () => {
    const row = {
      ...validCourse,
      id: '11111111-1111-1111-1111-11111111AAAA',
      end_at: '10000-01-01T00:00:00.000Z',
    }
    expect(() => assertCourse(row)).toThrow(ValidationError)
    expect(courseFromRow(row)).toMatchObject({
      id: '11111111-1111-1111-1111-11111111aaaa',
      end_at: '10000-01-01T00:00:00.000Z',
    })
  })

  it('still rejects a row with the wrong shape', () => {
    expect(() => courseFromRow({ ...validCourse, id: 'no-uuid' })).toThrow(
      ValidationError,
    )
  })
})

describe('personFromRow', () => {
  it('reads stored values that the input would reject', () => {
    const row = {
      ...validPerson,
      id: '22222222-2222-2222-2222-22222222BBBB',
      identification_document: '',
      birth_date: '10000-01-01',
    }
    expect(() => assertPerson(row)).toThrow(ValidationError)
    expect(personFromRow(row)).toMatchObject({
      id: '22222222-2222-2222-2222-22222222bbbb',
      identification_document: '',
      birth_date: '10000-01-01',
    })
  })

  it('still rejects a row with the wrong shape', () => {
    expect(() => personFromRow({ ...validPerson, phone: 5 })).toThrow(
      ValidationError,
    )
  })
})

describe('validators on external data', () => {
  it('validate a parsed JSON body without a cast', () => {
    const body: unknown = JSON.parse(JSON.stringify(validPersonCourse))
    expect(assertPersonCourse(body)).toEqual(validPersonCourse)
  })

  it('reject a body that is not an object', () => {
    expect(() => assertPersonCourse(JSON.parse('"text"'))).toThrow(
      ValidationError,
    )
    expect(() => assertPersonCourse(null)).toThrow(ValidationError)
  })
})
