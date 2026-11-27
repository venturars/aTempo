import { parseContractAddress } from '../domain/contract-address'
import type { Course } from '../domain/course'
import type { CourseRepository } from '../domain/course-repository'
import { assertEndsAfterStart, parseInstant } from '../domain/instant'
import { parseUuid } from '../domain/scalars'
import { parseNonEmptyText } from '../domain/text'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type UpdateCourseInput = {
  organizationId: string
  courseId: string
  name?: string
  acronym?: string
  startAt?: string
  endAt?: string
  contractAddress?: string
}

export type UpdateCourseDeps = {
  courses: CourseRepository
}

export function createUpdateCourse(deps: UpdateCourseDeps) {
  return async function updateCourse(
    input: UpdateCourseInput,
  ): Promise<Result<Course>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId
    const courseId = parseUuid(input.courseId)
    if (!courseId.ok) return courseId

    const course = await deps.courses.findById(courseId.value)
    if (!course || course.organizationId !== organizationId.value) {
      return err(new AppError('NOT_FOUND', 'El curso no existe.'))
    }

    let name = course.name
    if (input.name !== undefined) {
      const parsed = parseNonEmptyText(input.name, 'El nombre')
      if (!parsed.ok) return parsed
      name = parsed.value
    }

    let acronym = course.acronym
    if (input.acronym !== undefined) {
      const parsed = parseNonEmptyText(input.acronym, 'Las siglas')
      if (!parsed.ok) return parsed
      acronym = parsed.value
    }

    let startAt = course.startAt
    if (input.startAt !== undefined) {
      const parsed = parseInstant(input.startAt, 'La fecha de inicio')
      if (!parsed.ok) return parsed
      startAt = parsed.value
    }

    let endAt = course.endAt
    if (input.endAt !== undefined) {
      const parsed = parseInstant(input.endAt, 'La fecha de fin')
      if (!parsed.ok) return parsed
      endAt = parsed.value
    }

    const order = assertEndsAfterStart(startAt, endAt)
    if (!order.ok) return order

    let contractAddress = course.contractAddress
    if (input.contractAddress !== undefined) {
      const parsed = parseContractAddress(input.contractAddress)
      if (!parsed.ok) return parsed
      contractAddress = parsed.value
    }

    const byAcronym = await deps.courses.findByOrganizationAndAcronym(
      organizationId.value,
      acronym,
    )
    if (byAcronym && byAcronym.id !== course.id) {
      return err(
        new AppError(
          'CONFLICT',
          'Ya existe un curso con esas siglas en la organización.',
        ),
      )
    }
    const byAddress = await deps.courses.findByContractAddress(contractAddress)
    if (byAddress && byAddress.id !== course.id) {
      return err(
        new AppError('CONFLICT', 'La dirección del contrato ya está en uso.'),
      )
    }

    const next: Course = {
      id: course.id,
      organizationId: course.organizationId,
      name,
      acronym,
      startAt,
      endAt,
      contractAddress,
    }
    await deps.courses.save(next)
    return ok(next)
  }
}
