import type { EnrollmentRepository } from './enrollment-repository'
import type { Uuid } from './scalars'

export type AssignedCourseCount = {
  countAssignedCourses(input: { personId: Uuid }): Promise<number>
}

export function zeroAssignedCourseCount(): AssignedCourseCount {
  return {
    async countAssignedCourses() {
      return 0
    },
  }
}

export function fixedAssignedCourseCount(count: number): AssignedCourseCount {
  return {
    async countAssignedCourses() {
      return count
    },
  }
}

export function createEnrollmentAssignedCourseCount(
  enrollments: EnrollmentRepository,
): AssignedCourseCount {
  return {
    async countAssignedCourses({ personId }) {
      const courseIds = await enrollments.listCourseIdsByPerson(personId)
      return courseIds.length
    },
  }
}
