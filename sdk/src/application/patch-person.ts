import { AssignedCourseCount } from '../domain/assigned-course-count'
import { Person } from '../domain/person'
import { PersonRole } from '../domain/person-role'
import { parseUuid } from '../domain/scalars'
import {
  NormalizedPersonFields,
  normalizePersonFields,
} from '../domain/person-fields'
import { PersonRepository } from '../domain/person-repository'
import { assertRoleSet, isOrganizationAdmin, isTeacher } from '../domain/roles'
import { assertUniquePersonKeys } from '../domain/uniqueness'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type PatchPersonInput = {
  personId: string
  firstName?: string
  lastName?: string
  identificationDocument?: string
  email?: string
  birthDate?: string | null
  phone?: string | null
  roles?: PersonRole[]
}

export type PatchPersonDeps = {
  persons: PersonRepository
  assignedCourseCount: AssignedCourseCount
}

export function createPatchPerson(deps: PatchPersonDeps) {
  return async function patchPerson(
    input: PatchPersonInput,
  ): Promise<Result<Person>> {
    const parsedId = parseUuid(input.personId)
    if (!parsedId.ok) return parsedId

    const person = await deps.persons.findById(parsedId.value)
    if (!person) {
      return err(new AppError('NOT_FOUND', 'La persona no existe.'))
    }

    const fields = nextFields(person, input)
    if (!fields.ok) return fields

    const uniquePerson = await assertUniquePersonKeys(deps.persons, {
      ...fields.value,
      exceptPersonId: person.id,
    })
    if (!uniquePerson.ok) return uniquePerson

    const roles = nextRoles(person, input.roles)
    if (!roles.ok) return roles

    if (isTeacher(person.roles) && !isTeacher(roles.value)) {
      const count = await deps.assignedCourseCount.countAssignedCourses({
        personId: person.id,
      })
      if (count > 0) {
        return err(
          new AppError(
            'VALIDATION',
            'No se puede dejar de ser profesor con cursos asignados.',
          ),
        )
      }
    }

    const next: Person = {
      ...person,
      ...fields.value,
      roles: roles.value,
    }
    await deps.persons.save(next)
    return ok(next)
  }
}

function nextFields(
  person: Person,
  input: PatchPersonInput,
): Result<NormalizedPersonFields> {
  return normalizePersonFields({
    firstName: input.firstName ?? person.firstName,
    lastName: input.lastName ?? person.lastName,
    identificationDocument:
      input.identificationDocument ?? person.identificationDocument,
    email: input.email ?? person.email,
    birthDate:
      input.birthDate === undefined ? person.birthDate : input.birthDate,
    phone: input.phone === undefined ? person.phone : input.phone,
  })
}

function nextRoles(
  person: Person,
  roles: PersonRole[] | undefined,
): Result<PersonRole[]> {
  if (roles === undefined) {
    return ok(person.roles)
  }
  const unique = [...new Set(roles)]
  const roleSet = assertRoleSet(unique)
  if (!roleSet.ok) return roleSet

  if (
    unique.includes('organization_admin') &&
    !isOrganizationAdmin(person.roles)
  ) {
    return err(
      new AppError(
        'VALIDATION',
        'Nadie más se hace administrador de la organización.',
      ),
    )
  }
  if (
    isOrganizationAdmin(person.roles) &&
    !unique.includes('organization_admin')
  ) {
    return err(
      new AppError(
        'VALIDATION',
        'La organización debe conservar un administrador.',
      ),
    )
  }
  if (unique.includes('teacher') && !isTeacher(person.roles)) {
    if (!isOrganizationAdmin(person.roles)) {
      return err(
        new AppError(
          'VALIDATION',
          'Solo el administrador puede ser también profesor.',
        ),
      )
    }
  }
  return ok(unique)
}
