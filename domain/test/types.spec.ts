import { assertCourse } from '../src/types/course'
import { assertOrganization } from '../src/types/organization'
import { assertPerson } from '../src/types/person'
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
