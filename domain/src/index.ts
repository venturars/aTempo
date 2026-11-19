export {
  assertOrganization,
  assertOrganizationInput,
  type Organization,
  type OrganizationInput,
} from './types/organization'
export {
  assertBirthDate,
  assertPerson,
  assertPersonInput,
  normalizeEmail,
  type Person,
  type PersonInput,
} from './types/person'
export {
  assertCourse,
  assertCourseDates,
  assertCourseInput,
  assertContractAddress,
  normalizeContractAddress,
  type Course,
  type CourseInput,
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

export { query, closePool } from './postgres/db'
export { check } from './postgres/postgres'

export { listOrganizations } from './organization/list-organizations'
export { getOrganizationById } from './organization/get-organization-by-id'
export { createOrganization } from './organization/create-organization'
export { updateOrganization } from './organization/update-organization'
export { deleteOrganization } from './organization/delete-organization'
export { listPersons } from './person/list-persons'
export { getPersonById } from './person/get-person-by-id'
export { listPersonsByCourse } from './person/list-persons-by-course'
export { listPersonsByRole } from './person/list-persons-by-role'
export { createPerson } from './person/create-person'
export { updatePerson } from './person/update-person'
export { deletePerson } from './person/delete-person'
export { listCourses } from './course/list-courses'
export { getCourseById } from './course/get-course-by-id'
export { listCoursesByPerson } from './course/list-courses-by-person'
export { listCoursesByOrganization } from './course/list-courses-by-organization'
export { createCourse } from './course/create-course'
export { updateCourse } from './course/update-course'
export { deleteCourse } from './course/delete-course'
export { listRoles } from './role/list-roles'
export { getRoleByName } from './role/get-role-by-name'
export { listRolesByPerson } from './role/list-roles-by-person'
export { listPersonCourses } from './person-course/list-person-courses'
export { addPersonCourse } from './person-course/add-person-course'
export { removePersonCourse } from './person-course/remove-person-course'
export { listPersonRoles } from './person-role/list-person-roles'
export { addPersonRole } from './person-role/add-person-role'
export { removePersonRole } from './person-role/remove-person-role'
