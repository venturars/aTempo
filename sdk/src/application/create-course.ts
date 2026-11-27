import { randomUUID } from 'node:crypto'
import { parseContractAddress } from '../domain/contract-address'
import type { Course } from '../domain/course'
import type { CourseRepository } from '../domain/course-repository'
import { assertEndsAfterStart, parseInstant } from '../domain/instant'
import type { OrganizationRepository } from '../domain/organization-repository'
import { asUuid, parseUuid } from '../domain/scalars'
import { parseNonEmptyText } from '../domain/text'
import { AppError } from '../shared/app-error'
import { err, ok, Result } from '../shared/result'

export type CreateCourseInput = {
  organizationId: string
  name: string
  acronym: string
  startAt: string
  endAt: string
  contractAddress: string
}

export type CreateCourseDeps = {
  organizations: OrganizationRepository
  courses: CourseRepository
}

export function createCreateCourse(deps: CreateCourseDeps) {
  return async function createCourse(
    input: CreateCourseInput,
  ): Promise<Result<Course>> {
    const organizationId = parseUuid(input.organizationId)
    if (!organizationId.ok) return organizationId

    const organization = await deps.organizations.findById(organizationId.value)
    if (!organization) {
      return err(new AppError('NOT_FOUND', 'La organización no existe.'))
    }

    const name = parseNonEmptyText(input.name, 'El nombre')
    if (!name.ok) return name
    const acronym = parseNonEmptyText(input.acronym, 'Las siglas')
    if (!acronym.ok) return acronym
    const startAt = parseInstant(input.startAt, 'La fecha de inicio')
    if (!startAt.ok) return startAt
    const endAt = parseInstant(input.endAt, 'La fecha de fin')
    if (!endAt.ok) return endAt
    const order = assertEndsAfterStart(startAt.value, endAt.value)
    if (!order.ok) return order
    const contractAddress = parseContractAddress(input.contractAddress)
    if (!contractAddress.ok) return contractAddress

    const byAcronym = await deps.courses.findByOrganizationAndAcronym(
      organizationId.value,
      acronym.value,
    )
    if (byAcronym) {
      return err(
        new AppError(
          'CONFLICT',
          'Ya existe un curso con esas siglas en la organización.',
        ),
      )
    }
    const byAddress = await deps.courses.findByContractAddress(
      contractAddress.value,
    )
    if (byAddress) {
      return err(
        new AppError('CONFLICT', 'La dirección del contrato ya está en uso.'),
      )
    }

    const course: Course = {
      id: asUuid(randomUUID()),
      organizationId: organizationId.value,
      name: name.value,
      acronym: acronym.value,
      startAt: startAt.value,
      endAt: endAt.value,
      contractAddress: contractAddress.value,
    }
    await deps.courses.save(course)
    return ok(course)
  }
}