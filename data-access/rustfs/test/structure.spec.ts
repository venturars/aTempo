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
  'ValidationError',
  'assertBytes',
  'assertJustification',
  'assertJustificationCreate',
  'assertNonEmptyString',
  'assertObject',
  'assertString',
  'assertUuid',
  'check',
  'getJustification',
  'justificationExists',
  'normalizeUuid',
  'putJustification',
]

const EXPECTED_TYPE_NAMES = [
  'DomainErrorKind',
  'ErrorId',
  'ErrorReasonName',
  'GetJustificationInput',
  'GetJustificationOutput',
  'Justification',
  'JustificationCreate',
  'JustificationExistsInput',
  'JustificationExistsOutput',
  'PutJustificationInput',
  'PutJustificationOutput',
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

describe('estructura de data-access/rustfs', () => {
  it('shared/types exports no runtime values', () => {
    const files = listSharedTypeFiles()
    expect(files.sort()).toEqual(['justification.ts'])

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
