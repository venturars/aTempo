import type { Course } from './course'
import type { ContractAddress } from './contract-address'
import type { Uuid } from './scalars'
import type { NonEmptyText } from './text'

export type CourseRepository = {
  findById(courseId: Uuid): Promise<Course | null>
  findByOrganizationAndAcronym(
    organizationId: Uuid,
    acronym: NonEmptyText,
  ): Promise<Course | null>
  findByContractAddress(
    contractAddress: ContractAddress,
  ): Promise<Course | null>
  save(course: Course): Promise<void>
}