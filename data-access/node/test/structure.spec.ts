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
  'addPerson',
  'assertBirthDate',
  'assertContractAddress',
  'assertCourse',
  'assertCourseChanges',
  'assertCourseCreate',
  'assertCourseDates',
  'assertOrganization',
  'assertOrganizationChanges',
  'assertOrganizationCreate',
  'assertPerson',
  'assertPersonChanges',
  'assertPersonCourse',
  'assertPersonCreate',
  'assertPersonRole',
  'assertRole',
  'assertRoleName',
  'assignRole',
  'changeRole',
  'check',
  'closePool',
  'enrollPerson',
  'modifyCourse',
  'modifyOrganization',
  'modifyPerson',
  'normalizeContractAddress',
  'normalizeEmail',
  'normalizeUuid',
  'registerOrganization',
  'removeCourse',
  'removeOrganization',
  'removePerson',
  'retrieveAllCourses',
  'retrieveAllCoursesByOrganization',
  'retrieveAllCoursesByPerson',
  'retrieveAllOrganizations',
  'retrieveAllPersons',
  'retrieveAllPersonsByCourse',
  'retrieveAllPersonsByRole',
  'retrieveAllRoles',
  'retrieveAllRolesByPerson',
  'retrieveCourseById',
  'retrieveOrganizationById',
  'retrievePersonById',
  'revokeRole',
  'unenrollPerson',
]

const EXPECTED_TYPE_NAMES = [
  'AddCourseInput',
  'AddCourseOutput',
  'AddPersonInput',
  'AddPersonOutput',
  'AssignRoleInput',
  'AssignRoleOutput',
  'ChangeRoleInput',
  'ChangeRoleOutput',
  'Course',
  'CourseChanges',
  'CourseCreate',
  'DomainErrorKind',
  'EnrollPersonInput',
  'EnrollPersonOutput',
  'ErrorId',
  'ErrorReasonName',
  'ModifyCourseInput',
  'ModifyCourseOutput',
  'ModifyOrganizationInput',
  'ModifyOrganizationOutput',
  'ModifyPersonInput',
  'ModifyPersonOutput',
  'Organization',
  'OrganizationChanges',
  'OrganizationCreate',
  'Person',
  'PersonChanges',
  'PersonCourse',
  'PersonCreate',
  'PersonRole',
  'RegisterOrganizationInput',
  'RegisterOrganizationOutput',
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
  'RevokeRoleInput',
  'RevokeRoleOutput',
  'Role',
  'RoleName',
  'UnenrollPersonInput',
  'UnenrollPersonOutput',
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

describe('estructura de data-access/node', () => {
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
