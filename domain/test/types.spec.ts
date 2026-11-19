import { assertCourse, assertCourseInput } from '../src/types/course'
import {
  assertOrganization,
  assertOrganizationInput,
} from '../src/types/organization'
import { assertPerson, assertPersonInput } from '../src/types/person'
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
  it('accepts a complete person', () => {
    expect(() => assertPerson(validPerson)).not.toThrow()
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
