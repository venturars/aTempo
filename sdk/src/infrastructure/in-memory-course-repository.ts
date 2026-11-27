import type { ContractAddress } from '../domain/contract-address'
import type { Course } from '../domain/course'
import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import type { Uuid } from '../domain/scalars'
import type { NonEmptyText } from '../domain/text'

type EnrollmentKey = string

function enrollmentKey(personId: Uuid, courseId: Uuid): EnrollmentKey {
  return `${personId}\t${courseId}`
}

export class InMemoryCourseRepository
  implements CourseRepository, EnrollmentRepository
{
  private readonly courses = new Map<string, Course>()
  private readonly byOrgAcronym = new Map<string, string>()
  private readonly byContractAddress = new Map<string, string>()
  private readonly enrollments = new Map<EnrollmentKey, void>()
  private readonly byCourse = new Map<string, Set<string>>()
  private readonly byPerson = new Map<string, Set<string>>()

  async findById(courseId: Uuid): Promise<Course | null> {
    return this.courses.get(courseId) ?? null
  }

  async findByOrganizationAndAcronym(
    organizationId: Uuid,
    acronym: NonEmptyText,
  ): Promise<Course | null> {
    const id = this.byOrgAcronym.get(`${organizationId}\t${acronym}`)
    return id ? (this.courses.get(id) ?? null) : null
  }

  async findByContractAddress(
    contractAddress: ContractAddress,
  ): Promise<Course | null> {
    const id = this.byContractAddress.get(contractAddress.toLowerCase())
    return id ? (this.courses.get(id) ?? null) : null
  }

  async listByOrganization(organizationId: Uuid): Promise<Course[]> {
    return [...this.courses.values()]
      .filter((course) => course.organizationId === organizationId)
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  async save(course: Course): Promise<void> {
    const previous = this.courses.get(course.id)
    if (previous) {
      this.byOrgAcronym.delete(
        `${previous.organizationId}\t${previous.acronym}`,
      )
      this.byContractAddress.delete(previous.contractAddress.toLowerCase())
    }
    this.courses.set(course.id, course)
    this.byOrgAcronym.set(
      `${course.organizationId}\t${course.acronym}`,
      course.id,
    )
    this.byContractAddress.set(course.contractAddress.toLowerCase(), course.id)
  }

  async delete(courseId: Uuid): Promise<void> {
    const previous = this.courses.get(courseId)
    if (!previous) return
    this.courses.delete(courseId)
    this.byOrgAcronym.delete(
      `${previous.organizationId}\t${previous.acronym}`,
    )
    this.byContractAddress.delete(previous.contractAddress.toLowerCase())
  }

  async enroll(personId: Uuid, courseId: Uuid): Promise<void> {
    const key = enrollmentKey(personId, courseId)
    this.enrollments.set(key, undefined)
    this.addToIndex(this.byCourse, courseId, personId)
    this.addToIndex(this.byPerson, personId, courseId)
  }

  async unenroll(personId: Uuid, courseId: Uuid): Promise<boolean> {
    const key = enrollmentKey(personId, courseId)
    if (!this.enrollments.has(key)) return false
    this.enrollments.delete(key)
    this.removeFromIndex(this.byCourse, courseId, personId)
    this.removeFromIndex(this.byPerson, personId, courseId)
    return true
  }

  async listPersonIdsByCourse(courseId: Uuid): Promise<Uuid[]> {
    const ids = this.byCourse.get(courseId)
    if (!ids) return []
    return [...ids].map((id) => id as Uuid).sort()
  }

  async listCourseIdsByPerson(personId: Uuid): Promise<Uuid[]> {
    const ids = this.byPerson.get(personId)
    if (!ids) return []
    return [...ids].map((id) => id as Uuid).sort()
  }

  async deleteAllForPerson(personId: Uuid): Promise<void> {
    const courseIds = await this.listCourseIdsByPerson(personId)
    for (const courseId of courseIds) {
      await this.unenroll(personId, courseId)
    }
  }

  async hasEnrollment(personId: Uuid, courseId: Uuid): Promise<boolean> {
    return this.enrollments.has(enrollmentKey(personId, courseId))
  }

  private addToIndex(
    index: Map<string, Set<string>>,
    key: string,
    value: string,
  ) {
    let set = index.get(key)
    if (!set) {
      set = new Set()
      index.set(key, set)
    }
    set.add(value)
  }

  private removeFromIndex(
    index: Map<string, Set<string>>,
    key: string,
    value: string,
  ) {
    const set = index.get(key)
    if (!set) return
    set.delete(value)
    if (set.size === 0) index.delete(key)
  }
}
