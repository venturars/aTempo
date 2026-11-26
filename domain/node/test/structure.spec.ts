import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import * as publicApi from '../src'

const SRC_DIR = join(__dirname, '..', 'src')
const SHARED_TYPES_DIR = join(SRC_DIR, 'shared', 'types')
const INDEX_FILE = join(SRC_DIR, 'index.ts')

const EXPECTED_VALUE_NAMES = [
  'ConfigurationError',
  'ConflictError',
  'DomainError',
  'NotFoundError',
  'PersistenceError',
  'ROLE_NAMES',
  'ValidationError',
  'addCourse',
  'addOrganization',
  'addPerson',
  'addPersonCourse',
  'addPersonRole',
  'assertBirthDate',
  'assertContractAddress',
  'assertCourse',
  'assertCourseCreate',
  'assertCourseDates',
  'assertCourseUpdate',
  'assertOrganization',
  'assertOrganizationCreate',
  'assertOrganizationUpdate',
  'assertPerson',
  'assertPersonCourse',
  'assertPersonCreate',
  'assertPersonRole',
  'assertPersonUpdate',
  'assertRole',
  'assertRoleName',
  'check',
  'closePool',
  'courseFromRow',
  'deregisterPersonCourse',
  'deregisterPersonRole',
  'normalizeContractAddress',
  'normalizeEmail',
  'normalizeUuid',
  'personFromRow',
  'removeCourse',
  'removeOrganization',
  'removePerson',
  'retrieveAllCourses',
  'retrieveAllCoursesByOrganization',
  'retrieveAllCoursesByPerson',
  'retrieveAllOrganizations',
  'retrieveAllPersonCourses',
  'retrieveAllPersonRoles',
  'retrieveAllPersons',
  'retrieveAllPersonsByCourse',
  'retrieveAllPersonsByRole',
  'retrieveAllRoles',
  'retrieveAllRolesByPerson',
  'retrieveCourseById',
  'retrieveOrganizationById',
  'retrievePersonById',
  'retrieveRoleByName',
  'updateCourse',
  'updateOrganization',
  'updatePerson',
]

const EXPECTED_TYPE_NAMES = [
  'AddCourseInput',
  'AddCourseOutput',
  'AddOrganizationInput',
  'AddOrganizationOutput',
  'AddPersonCourseInput',
  'AddPersonCourseOutput',
  'AddPersonInput',
  'AddPersonOutput',
  'AddPersonRoleInput',
  'AddPersonRoleOutput',
  'Course',
  'CourseCreate',
  'CourseUpdate',
  'DeregisterPersonCourseInput',
  'DeregisterPersonCourseOutput',
  'DeregisterPersonRoleInput',
  'DeregisterPersonRoleOutput',
  'DomainErrorId',
  'DomainErrorKind',
  'DomainErrorReason',
  'Organization',
  'OrganizationCreate',
  'OrganizationUpdate',
  'Person',
  'PersonCourse',
  'PersonCourseLookup',
  'PersonCreate',
  'PersonRole',
  'PersonUpdate',
  'RemoveCourseInput',
  'RemoveCourseOutput',
  'RemoveOrganizationInput',
  'RemoveOrganizationOutput',
  'RemovePersonInput',
  'RemovePersonOutput',
  'RetrieveAllCoursesByOrganizationInput',
  'RetrieveAllCoursesByOrganizationOutput',
  'RetrieveAllCoursesByPersonInput',
  'RetrieveAllCoursesByPersonOutput',
  'RetrieveAllCoursesOutput',
  'RetrieveAllOrganizationsOutput',
  'RetrieveAllPersonCoursesOutput',
  'RetrieveAllPersonRolesOutput',
  'RetrieveAllPersonsByCourseInput',
  'RetrieveAllPersonsByCourseOutput',
  'RetrieveAllPersonsByRoleInput',
  'RetrieveAllPersonsByRoleOutput',
  'RetrieveAllPersonsOutput',
  'RetrieveAllRolesByPersonInput',
  'RetrieveAllRolesByPersonOutput',
  'RetrieveAllRolesOutput',
  'RetrieveCourseByIdInput',
  'RetrieveCourseByIdOutput',
  'RetrieveOrganizationByIdInput',
  'RetrieveOrganizationByIdOutput',
  'RetrievePersonByIdInput',
  'RetrievePersonByIdOutput',
  'RetrieveRoleByNameInput',
  'RetrieveRoleByNameOutput',
  'Role',
  'RoleName',
  'UpdateCourseInput',
  'UpdateCourseOutput',
  'UpdateOrganizationInput',
  'UpdateOrganizationOutput',
  'UpdatePersonInput',
  'UpdatePersonOutput',
]

function listSharedTypeFiles(): string[] {
  return readdirSync(SHARED_TYPES_DIR).filter((file) => file.endsWith('.ts'))
}

function readExportedNamesOfIndex(): string[] {
  const program = ts.createProgram({
    rootNames: [INDEX_FILE],
    options: {
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      strict: true,
    },
  })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(INDEX_FILE)
  if (!sourceFile) {
    return []
  }
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    return []
  }
  return checker
    .getExportsOfModule(moduleSymbol)
    .map((exported) => exported.getName())
}

describe('estructura de domain/node', () => {
  it('shared/types exports no runtime values', () => {
    const files = listSharedTypeFiles()
    expect(files.sort()).toEqual([
      'course.ts',
      'organization.ts',
      'person-course.ts',
      'person-role.ts',
      'person.ts',
      'role.ts',
    ])

    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loadedModule: object = require(join(SHARED_TYPES_DIR, file))
      expect({ file, values: Object.keys(loadedModule) }).toEqual({
        file,
        values: [],
      })
    }
  })

  it('index exports the same names', () => {
    expect(Object.keys(publicApi).sort()).toEqual(EXPECTED_VALUE_NAMES)

    const allExpectedNames = [
      ...EXPECTED_VALUE_NAMES,
      ...EXPECTED_TYPE_NAMES,
    ].sort()
    expect(readExportedNamesOfIndex().sort()).toEqual(allExpectedNames)
  }, 30000)
})
