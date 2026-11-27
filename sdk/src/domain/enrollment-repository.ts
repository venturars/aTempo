import type { Uuid } from './scalars'

export type EnrollmentRepository = {
  enroll(personId: Uuid, courseId: Uuid): Promise<void>
  unenroll(personId: Uuid, courseId: Uuid): Promise<boolean>
  listPersonIdsByCourse(courseId: Uuid): Promise<Uuid[]>
  listCourseIdsByPerson(personId: Uuid): Promise<Uuid[]>
  deleteAllForPerson(personId: Uuid): Promise<void>
  hasEnrollment(personId: Uuid, courseId: Uuid): Promise<boolean>
}