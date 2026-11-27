import { createAfterAuth } from '../application/after-auth'
import { createCreateCourse } from '../application/create-course'
import { createCreateOrganization } from '../application/create-organization'
import { createDeletePerson } from '../application/delete-person'
import { createEnrollPersonInCourse } from '../application/enroll-person-in-course'
import { createGetOrganization } from '../application/get-organization'
import { createGetPerson } from '../application/get-person'
import { createInvitePerson } from '../application/invite-person'
import { createListCoursePeople } from '../application/list-course-people'
import { createListPeople } from '../application/list-people'
import { createUnenrollPersonFromCourse } from '../application/unenroll-person-from-course'
import { createPatchOrganization } from '../application/patch-organization'
import { createPatchPerson } from '../application/patch-person'
import {
  createEnrollmentAssignedCourseCount,
  type AssignedCourseCount,
} from '../domain/assigned-course-count'
import type { CourseRepository } from '../domain/course-repository'
import type { EnrollmentRepository } from '../domain/enrollment-repository'
import { OrganizationRepository } from '../domain/organization-repository'
import { InMemoryCourseRepository } from '../infrastructure/in-memory-course-repository'
import { InMemoryPersonRepository } from '../infrastructure/in-memory-person-repository'
import {
  createPostgresHealthClient,
  FetchLike,
} from '../infrastructure/postgres-health-client'

export type CreateSdkInput = {
  fetch?: FetchLike
  readPostgresApiUrl?: () => string | undefined
  persons?: InMemoryPersonRepository
  healthTimeoutMs?: number
  courses?: CourseRepository & EnrollmentRepository
  assignedCourseCount?: AssignedCourseCount
}

export function createSdk(input: CreateSdkInput = {}) {
  const persons = input.persons ?? new InMemoryPersonRepository()
  const organizations: OrganizationRepository = {
    findById: (organizationId) => persons.findOrganizationById(organizationId),
    findByTaxId: (taxId) => persons.findByTaxId(taxId),
    save: (organization) => persons.saveOrganization(organization),
  }
  const courses =
    input.courses ?? new InMemoryCourseRepository()
  const assignedCourseCount =
    input.assignedCourseCount ?? createEnrollmentAssignedCourseCount(courses)
  const checkHealth = createPostgresHealthClient({
    fetch: input.fetch ?? globalThis.fetch.bind(globalThis),
    timeoutMs: input.healthTimeoutMs,
  })
  const afterAuth = createAfterAuth({
    readPostgresApiUrl:
      input.readPostgresApiUrl ?? (() => process.env.API_POSTGRESQL_URL),
    checkHealth,
    persons,
  })
  const directory = { organizations, persons, courses }

  return {
    afterAuth,
    persons,
    createOrganization: createCreateOrganization(directory),
    getOrganization: createGetOrganization({ organizations }),
    patchOrganization: createPatchOrganization({ organizations }),
    invitePerson: createInvitePerson(directory),
    listPeople: createListPeople(directory),
    getPerson: createGetPerson({ persons }),
    patchPerson: createPatchPerson({ persons, assignedCourseCount }),
    deletePerson: createDeletePerson({
      persons,
      enrollments: courses,
      assignedCourseCount,
    }),
    createCourse: createCreateCourse({ organizations, courses }),
    enrollPersonInCourse: createEnrollPersonInCourse({
      persons,
      courses,
      enrollments: courses,
    }),
    unenrollPersonFromCourse: createUnenrollPersonFromCourse({
      courses,
      enrollments: courses,
    }),
    listCoursePeople: createListCoursePeople({
      persons,
      courses,
      enrollments: courses,
    }),
  }
}

export type Sdk = ReturnType<typeof createSdk>
