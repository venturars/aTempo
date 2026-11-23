export {
  ConflictError,
  ConfigurationError,
  DomainError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  type DomainErrorCode,
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
  normalizeContractAddress,
  type Course,
  type CourseCreate,
  type CourseUpdate,
} from './types/course'
export {
  assertPersonCourse,
  type PersonCourse,
} from './types/person-course'
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
  listOrganizations,
  type ListOrganizationsOutput,
} from './organization/list-organizations'
export {
  getOrganizationById,
  type GetOrganizationByIdInput,
  type GetOrganizationByIdOutput,
} from './organization/get-organization-by-id'
export {
  createOrganization,
  type CreateOrganizationInput,
  type CreateOrganizationOutput,
} from './organization/create-organization'
export {
  updateOrganization,
  type UpdateOrganizationInput,
  type UpdateOrganizationOutput,
} from './organization/update-organization'
export {
  deleteOrganization,
  type DeleteOrganizationInput,
  type DeleteOrganizationOutput,
} from './organization/delete-organization'
export {
  listPersons,
  type ListPersonsOutput,
} from './person/list-persons'
export {
  getPersonById,
  type GetPersonByIdInput,
  type GetPersonByIdOutput,
} from './person/get-person-by-id'
export {
  listPersonsByCourse,
  type ListPersonsByCourseInput,
  type ListPersonsByCourseOutput,
} from './person/list-persons-by-course'
export {
  listPersonsByRole,
  type ListPersonsByRoleInput,
  type ListPersonsByRoleOutput,
} from './person/list-persons-by-role'
export {
  createPerson,
  type CreatePersonInput,
  type CreatePersonOutput,
} from './person/create-person'
export {
  updatePerson,
  type UpdatePersonInput,
  type UpdatePersonOutput,
} from './person/update-person'
export {
  deletePerson,
  type DeletePersonInput,
  type DeletePersonOutput,
} from './person/delete-person'
export {
  listCourses,
  type ListCoursesOutput,
} from './course/list-courses'
export {
  getCourseById,
  type GetCourseByIdInput,
  type GetCourseByIdOutput,
} from './course/get-course-by-id'
export {
  listCoursesByPerson,
  type ListCoursesByPersonInput,
  type ListCoursesByPersonOutput,
} from './course/list-courses-by-person'
export {
  listCoursesByOrganization,
  type ListCoursesByOrganizationInput,
  type ListCoursesByOrganizationOutput,
} from './course/list-courses-by-organization'
export {
  createCourse,
  type CreateCourseInput,
  type CreateCourseOutput,
} from './course/create-course'
export {
  updateCourse,
  type UpdateCourseInput,
  type UpdateCourseOutput,
} from './course/update-course'
export {
  deleteCourse,
  type DeleteCourseInput,
  type DeleteCourseOutput,
} from './course/delete-course'
export {
  listRoles,
  type ListRolesOutput,
} from './role/list-roles'
export {
  getRoleByName,
  type GetRoleByNameInput,
  type GetRoleByNameOutput,
} from './role/get-role-by-name'
export {
  listRolesByPerson,
  type ListRolesByPersonInput,
  type ListRolesByPersonOutput,
} from './role/list-roles-by-person'
export {
  listPersonCourses,
  type ListPersonCoursesOutput,
} from './person-course/list-person-courses'
export {
  addPersonCourse,
  type AddPersonCourseInput,
  type AddPersonCourseOutput,
} from './person-course/add-person-course'
export {
  removePersonCourse,
  type RemovePersonCourseInput,
  type RemovePersonCourseOutput,
} from './person-course/remove-person-course'
export {
  listPersonRoles,
  type ListPersonRolesOutput,
} from './person-role/list-person-roles'
export {
  addPersonRole,
  type AddPersonRoleInput,
  type AddPersonRoleOutput,
} from './person-role/add-person-role'
export {
  removePersonRole,
  type RemovePersonRoleInput,
  type RemovePersonRoleOutput,
} from './person-role/remove-person-role'
