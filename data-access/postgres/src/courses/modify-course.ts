import { fail } from '../shared/errors'
import { ensureOrganizationExists } from '../organizations/rules'
import { findCourseById, updateCourseRow } from '../postgres/executors/course'
import { withTransaction } from '../postgres/pool'
import { courseFromRow } from '../postgres/rows/course'
import { assertUuid, normalizeUuid } from '../shared/validation/assert'
import {
  assertCourseChanges,
  assertCourseUpdate,
  normalizeContractAddress,
} from '../shared/validation/course'
import type { Course, CourseChanges } from '../shared/types/course'
import { ensureAcronymAvailable, ensureContractAddressAvailable } from './rules'

export type ModifyCourseInput = {
  id: string
  changes: CourseChanges
}

export type ModifyCourseOutput = {
  course: Course
}

/**
 * Cambia solo los campos que vienen en `changes`. Las reglas se comprueban
 * sobre el curso completo, ya con los cambios aplicados: si solo cambia
 * `end_at`, se compara con el `start_at` guardado.
 */
export async function modifyCourse(
  input: ModifyCourseInput,
): Promise<ModifyCourseOutput> {
  const id = normalizeUuid(assertUuid(input.id, 'course.id'))
  const changes = assertCourseChanges(input.changes)

  const modified = await withTransaction(async (run) => {
    const current = await findCourseById(id, run)
    if (!current) {
      fail('course', 'missing')
    }

    const course = assertCourseUpdate({
      ...courseFromRow(current),
      ...changes,
      id,
    })
    const contractAddress = normalizeContractAddress(course.contract_address)
    await ensureOrganizationExists({ id: course.organization_id }, run)
    await ensureContractAddressAvailable({ contractAddress, ignoreId: id }, run)
    await ensureAcronymAvailable(
      {
        organizationId: course.organization_id,
        acronym: course.acronym,
        ignoreId: id,
      },
      run,
    )

    const row = await updateCourseRow(
      { ...course, contract_address: contractAddress },
      run,
    )
    return courseFromRow(row)
  })

  return { course: modified }
}
