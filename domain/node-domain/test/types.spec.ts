import { normalizeUuid } from '../src/types/assert'
import {
  assertCourse,
  assertCourseInput,
  normalizeContractAddress,
} from '../src/types/course'
import {
  assertOrganization,
  assertOrganizationInput,
} from '../src/types/organization'
import {
  assertPerson,
  assertPersonInput,
  normalizeEmail,
} from '../src/types/person'
import { assertPersonCourse } from '../src/types/person-course'
import { assertPersonRole } from '../src/types/person-role'
import { assertRole } from '../src/types/role'
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

  it('normalizes contract address to lowercase hex', () => {
    expect(
      normalizeContractAddress(
        '0x5FBDB2315678AFECb367F032D93F642F64180AA3',
      ),
    ).toBe('0x5fbdb2315678afecb367f032d93f642f64180aa3')
  })

  it('accepts a complete person', () => {
    expect(() => assertPerson(validPerson)).not.toThrow()
  })

  it('rejects an invalid birth_date', () => {
    expect(() =>
      assertPersonInput({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: '2026-02-30',
        phone: validPerson.phone,
      }),
    ).toThrow('person.birth_date debe ser una fecha')
  })

  it('accepts a birth_date in year 0050', () => {
    expect(() =>
      assertPerson({ ...validPerson, birth_date: '0050-06-15' }),
    ).not.toThrow()
  })

  it('rejects an empty first_name on write and keeps it on read', () => {
    expect(() =>
      assertPersonInput({
        identification_document: validPerson.identification_document,
        email: validPerson.email,
        first_name: '',
        last_name: validPerson.last_name,
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      }),
    ).toThrow('person.first_name debe ser un string no vacío')
    expect(assertPerson({ ...validPerson, first_name: '' }).first_name).toBe('')
  })

  it('rejects a person missing a field', () => {
    const incomplete = {
      id: validPerson.id,
      email: validPerson.email,
      first_name: validPerson.first_name,
      last_name: validPerson.last_name,
      birth_date: validPerson.birth_date,
      phone: validPerson.phone,
    }
    expect(() => assertPerson(incomplete)).toThrow(
      'person.identification_document debe ser un string no vacío',
    )
  })

  it('rejects a create input missing a field', () => {
    expect(() => assertOrganizationInput({ name: 'Acme' })).toThrow(
      'organization.tax_id debe ser un string no vacío',
    )
    expect(() =>
      assertPersonInput({
        email: validPerson.email,
        first_name: validPerson.first_name,
        last_name: validPerson.last_name,
        birth_date: validPerson.birth_date,
        phone: validPerson.phone,
      }),
    ).toThrow('person.identification_document debe ser un string no vacío')
    expect(() =>
      assertCourseInput({
        organization_id: validCourse.organization_id,
        name: validCourse.name,
        acronym: validCourse.acronym,
        start_at: validCourse.start_at,
        end_at: validCourse.end_at,
      }),
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
  })

  it('rejects an invented role name', () => {
    expect(() => assertRole({ name: 'admin' })).toThrow(
      'role.name debe ser organization_admin, teacher o student',
    )
  })

  it('accepts organization, course and junctions', () => {
    expect(() => assertOrganization(validOrganization)).not.toThrow()
    expect(() => assertCourse(validCourse)).not.toThrow()
    expect(() => assertPersonCourse(validPersonCourse)).not.toThrow()
    expect(() => assertPersonRole(validPersonRole)).not.toThrow()
    expect(() => assertRole({ name: 'teacher' })).not.toThrow()
  })
})
