export {
  ConflictError,
  ConfigurationError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  type DomainErrorKind,
  type DomainErrorId,
  type DomainErrorReason,
} from './errors'

export { normalizeUuid } from './types/assert'
export {
  assertOrganization,
  assertOrganizationCreate,
  assertOrganizationUpdate,
  type Organization,
  type OrganizationCreate,
  type OrganizationUpdate,
} from './types/organization'
export {
  assertBirthDate,
  assertPerson,
  assertPersonCreate,
  assertPersonUpdate,
  personFromRow,
  normalizeEmail,
  type Person,
  type PersonCreate,
  type PersonUpdate,
} from './types/person'
export {
  assertCourse,
  assertCourseCreate,
  assertCourseDates,
  assertCourseUpdate,
  assertContractAddress,
  courseFromRow,
  normalizeContractAddress,
  type Course,
  type CourseCreate,
  type CourseUpdate,
} from './types/course'
export { assertPersonCourse, type PersonCourse } from './types/person-course'
export {
  ROLE_NAMES,
  assertRole,
  assertRoleName,
  type Role,
  type RoleName,
} from './types/role'
export { assertPersonRole, type PersonRole } from './types/person-role'

export { closePool } from './postgres/pool'
export { check } from './postgres/check'
export type { PersonCourseLookup } from './postgres/executors/person-course'

export {
  retrieveAllOrganizations,
  type RetrieveAllOrganizationsOutput,
} from './organization/retrieve-all-organizations'
export {
  retrieveOrganizationById,
  type RetrieveOrganizationByIdInput,
  type RetrieveOrganizationByIdOutput,
} from './organization/retrieve-organization-by-id'
export {
  addOrganization,
  type AddOrganizationInput,
  type AddOrganizationOutput,
} from './organization/add-organization'
export {
  updateOrganization,
  type UpdateOrganizationInput,
  type UpdateOrganizationOutput,
} from './organization/update-organization'
export {
  removeOrganization,
  type RemoveOrganizationInput,
  type RemoveOrganizationOutput,
} from './organization/remove-organization'
export {
  retrieveAllPersons,
  type RetrieveAllPersonsOutput,
} from './person/retrieve-all-persons'
export {
  retrievePersonById,
  type RetrievePersonByIdInput,
  type RetrievePersonByIdOutput,
} from './person/retrieve-person-by-id'
export {
  retrieveAllPersonsByCourse,
  type RetrieveAllPersonsByCourseInput,
  type RetrieveAllPersonsByCourseOutput,
} from './person/retrieve-all-persons-by-course'
export {
  retrieveAllPersonsByRole,
  type RetrieveAllPersonsByRoleInput,
  type RetrieveAllPersonsByRoleOutput,
} from './person/retrieve-all-persons-by-role'
export {
  addPerson,
  type AddPersonInput,
  type AddPersonOutput,
} from './person/add-person'
export {
  updatePerson,
  type UpdatePersonInput,
  type UpdatePersonOutput,
} from './person/update-person'
export {
  removePerson,
  type RemovePersonInput,
  type RemovePersonOutput,
} from './person/remove-person'
export {
  retrieveAllCourses,
  type RetrieveAllCoursesOutput,
} from './course/retrieve-all-courses'
export {
  retrieveCourseById,
  type RetrieveCourseByIdInput,
  type RetrieveCourseByIdOutput,
} from './course/retrieve-course-by-id'
export {
  retrieveAllCoursesByPerson,
  type RetrieveAllCoursesByPersonInput,
  type RetrieveAllCoursesByPersonOutput,
} from './course/retrieve-all-courses-by-person'
export {
  retrieveAllCoursesByOrganization,
  type RetrieveAllCoursesByOrganizationInput,
  type RetrieveAllCoursesByOrganizationOutput,
} from './course/retrieve-all-courses-by-organization'
export {
  addCourse,
  type AddCourseInput,
  type AddCourseOutput,
} from './course/add-course'
export {
  updateCourse,
  type UpdateCourseInput,
  type UpdateCourseOutput,
} from './course/update-course'
export {
  removeCourse,
  type RemoveCourseInput,
  type RemoveCourseOutput,
} from './course/remove-course'
export {
  retrieveAllRoles,
  type RetrieveAllRolesOutput,
} from './role/retrieve-all-roles'
export {
  retrieveRoleByName,
  type RetrieveRoleByNameInput,
  type RetrieveRoleByNameOutput,
} from './role/retrieve-role-by-name'
export {
  retrieveAllRolesByPerson,
  type RetrieveAllRolesByPersonInput,
  type RetrieveAllRolesByPersonOutput,
} from './role/retrieve-all-roles-by-person'
export {
  retrieveAllPersonCourses,
  type RetrieveAllPersonCoursesOutput,
} from './person-course/retrieve-all-person-courses'
export {
  addPersonCourse,
  type AddPersonCourseInput,
  type AddPersonCourseOutput,
} from './person-course/add-person-course'
export {
  deregisterPersonCourse,
  type DeregisterPersonCourseInput,
  type DeregisterPersonCourseOutput,
} from './person-course/deregister-person-course'
export {
  retrieveAllPersonRoles,
  type RetrieveAllPersonRolesOutput,
} from './person-role/retrieve-all-person-roles'
export {
  addPersonRole,
  type AddPersonRoleInput,
  type AddPersonRoleOutput,
} from './person-role/add-person-role'
export {
  deregisterPersonRole,
  type DeregisterPersonRoleInput,
  type DeregisterPersonRoleOutput,
} from './person-role/deregister-person-role'
