import { AssignedCourseCount } from '../domain/assigned-course-count'
import { EnrollmentRepository } from '../domain/enrollment-repository'
import { PersonRepository } from '../domain/person-repository'
import { isOrganizationAdmin, isTeacher } from '../domain/roles'
import { parseUuid } from '../domain/scalars'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type DeletePersonInput = { personId: string }

export type DeletePersonDeps = {
  persons: PersonRepository
  enrollments: EnrollmentRepository
  assignedCourseCount: AssignedCourseCount
}

export function createDeletePerson(deps: DeletePersonDeps) {
  return async function deletePerson({
    personId,
  }: DeletePersonInput): Promise<Result<void>> {
    const parsedId = parseUuid(personId)
    if (!parsedId.ok) return parsedId

    const person = await deps.persons.findById(parsedId.value)
    if (!person) {
      return err(new AppError('NOT_FOUND', 'La persona no existe.'))
    }
    if (isOrganizationAdmin(person.roles)) {
      return err(
        new AppError(
          'VALIDATION',
          'No se puede borrar al administrador de la organización.',
        ),
      )
    }
    if (isTeacher(person.roles)) {
      const count = await deps.assignedCourseCount.countAssignedCourses({
        personId: person.id,
      })
      if (count > 0) {
        return err(
          new AppError(
            'VALIDATION',
            'No se puede borrar a un profesor con cursos asignados.',
          ),
        )
      }
    }
    await deps.enrollments.deleteAllForPerson(parsedId.value)
    await deps.persons.delete(parsedId.value)
    return ok(undefined)
  }
}
