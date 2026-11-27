export {
  ConflictError,
  ConfigurationError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  type DomainErrorKind,
} from '@atempo/errors'
export type { DomainErrorId, DomainErrorReason } from './shared/errors'

export type {
  Organization,
  OrganizationChanges,
  OrganizationCreate,
} from './shared/types/organization'
export type { Person, PersonChanges, PersonCreate } from './shared/types/person'
export type { Course, CourseChanges, CourseCreate } from './shared/types/course'
export type { PersonCourse } from './shared/types/person-course'
export type { Role, RoleName } from './shared/types/role'
export type { PersonRole } from './shared/types/person-role'

export { normalizeUuid } from './shared/validation/assert'
export {
  assertOrganization,
  assertOrganizationCreate,
  assertOrganizationChanges,
} from './shared/validation/organization'
export {
  assertBirthDate,
  assertPerson,
  assertPersonCreate,
  assertPersonChanges,
  normalizeEmail,
} from './shared/validation/person'
export {
  assertCourse,
  assertCourseCreate,
  assertCourseChanges,
  assertCourseDates,
  assertContractAddress,
  normalizeContractAddress,
} from './shared/validation/course'
export { assertPersonCourse } from './shared/validation/person-course'
export {
  ROLE_NAMES,
  assertRole,
  assertRoleName,
} from './shared/validation/role'
export { assertPersonRole } from './shared/validation/person-role'

export { closePool } from './postgres/pool'
export { check } from './postgres/check'

// organizations: registro (con su admin), cambios, baja y consulta
export {
  registerOrganization,
  type RegisterOrganizationInput,
  type RegisterOrganizationOutput,
} from './organizations/register-organization'
export {
  modifyOrganization,
  type ModifyOrganizationInput,
  type ModifyOrganizationOutput,
} from './organizations/modify-organization'
export {
  removeOrganization,
  type RemoveOrganizationInput,
  type RemoveOrganizationOutput,
} from './organizations/remove-organization'
export {
  retrieveOrganizationById,
  type RetrieveOrganizationByIdInput,
  type RetrieveOrganizationByIdOutput,
} from './organizations/retrieve-organization-by-id'
export {
  retrieveAllOrganizations,
  type RetrieveAllOrganizationsOutput,
} from './organizations/retrieve-all-organizations'

// people: alta, cambios, baja y consulta de personas
export {
  addPerson,
  type AddPersonInput,
  type AddPersonOutput,
} from './people/add-person'
export {
  modifyPerson,
  type ModifyPersonInput,
  type ModifyPersonOutput,
} from './people/modify-person'
export {
  removePerson,
  type RemovePersonInput,
  type RemovePersonOutput,
} from './people/remove-person'
export {
  retrievePersonById,
  type RetrievePersonByIdInput,
  type RetrievePersonByIdOutput,
} from './people/retrieve-person-by-id'
export {
  retrieveAllPersons,
  type RetrieveAllPersonsOutput,
} from './people/retrieve-all-persons'

// roles: dar, quitar y cambiar el rol de una persona
export {
  assignRole,
  type AssignRoleInput,
  type AssignRoleOutput,
} from './roles/assign-role'
export {
  revokeRole,
  type RevokeRoleInput,
  type RevokeRoleOutput,
} from './roles/revoke-role'
export {
  changeRole,
  type ChangeRoleInput,
  type ChangeRoleOutput,
} from './roles/change-role'
export {
  retrieveAllRoles,
  type RetrieveAllRolesOutput,
} from './roles/retrieve-all-roles'
export {
  retrieveAllRolesByPerson,
  type RetrieveAllRolesByPersonInput,
  type RetrieveAllRolesByPersonOutput,
} from './roles/retrieve-all-roles-by-person'
export {
  retrieveAllPersonsByRole,
  type RetrieveAllPersonsByRoleInput,
  type RetrieveAllPersonsByRoleOutput,
} from './roles/retrieve-all-persons-by-role'

// courses: alta, cambios, baja y consulta de cursos
export {
  addCourse,
  type AddCourseInput,
  type AddCourseOutput,
} from './courses/add-course'
export {
  modifyCourse,
  type ModifyCourseInput,
  type ModifyCourseOutput,
} from './courses/modify-course'
export {
  removeCourse,
  type RemoveCourseInput,
  type RemoveCourseOutput,
} from './courses/remove-course'
export {
  retrieveCourseById,
  type RetrieveCourseByIdInput,
  type RetrieveCourseByIdOutput,
} from './courses/retrieve-course-by-id'
export {
  retrieveAllCourses,
  type RetrieveAllCoursesOutput,
} from './courses/retrieve-all-courses'
export {
  retrieveAllCoursesByOrganization,
  type RetrieveAllCoursesByOrganizationInput,
  type RetrieveAllCoursesByOrganizationOutput,
} from './courses/retrieve-all-courses-by-organization'

// enrollment: matricular y desmatricular personas en cursos
export {
  enrollPerson,
  type EnrollPersonInput,
  type EnrollPersonOutput,
} from './enrollment/enroll-person'
export {
  unenrollPerson,
  type UnenrollPersonInput,
  type UnenrollPersonOutput,
} from './enrollment/unenroll-person'
export {
  retrieveAllPersonsByCourse,
  type RetrieveAllPersonsByCourseInput,
  type RetrieveAllPersonsByCourseOutput,
} from './enrollment/retrieve-all-persons-by-course'
export {
  retrieveAllCoursesByPerson,
  type RetrieveAllCoursesByPersonInput,
  type RetrieveAllCoursesByPersonOutput,
} from './enrollment/retrieve-all-courses-by-person'
