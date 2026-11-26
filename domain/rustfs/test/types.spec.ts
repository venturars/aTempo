import {
  ValidationError,
  assertJustification,
  assertJustificationCreate,
  assertUuid,
  normalizeUuid,
} from '../src'
import { DOCUMENT_ID, validJustification } from './helpers'

describe('tipos de justificante', () => {
  it('acepta un etag vacío y rechaza uno que no es string con un mensaje que no dice "no vacío"', () => {
    const stored = { ...validJustification, etag: '' }
    expect(assertJustification(stored).etag).toBe('')
    expect(() =>
      assertJustification({ ...stored, etag: 123 as unknown as string }),
    ).toThrow(/^justification\.etag debe ser un string$/)
  })

  it('lanza ValidationError si el UUID es inválido', () => {
    expect(() => assertUuid('no-es-uuid', 'justification.document_id')).toThrow(
      ValidationError,
    )
    expect(() =>
      assertJustificationCreate({
        ...validJustification,
        document_id: 'no-es-uuid',
      }),
    ).toThrow(ValidationError)
  })

  it('lanza ValidationError si content_type está vacío', () => {
    expect(() =>
      assertJustificationCreate({
        ...validJustification,
        content_type: '',
      }),
    ).toThrow(ValidationError)
  })

  it('lanza ValidationError si body no es bytes', () => {
    expect(() =>
      assertJustificationCreate({
        ...validJustification,
        body: [1, 2, 3] as unknown as Uint8Array,
      }),
    ).toThrow(ValidationError)
  })

  it('normaliza un UUID con mayúsculas a minúsculas', () => {
    const upper = DOCUMENT_ID.toUpperCase()

    expect(normalizeUuid(upper)).toBe(DOCUMENT_ID)
    expect(
      assertJustificationCreate({
        ...validJustification,
        document_id: upper,
      }).document_id,
    ).toBe(DOCUMENT_ID)
  })
})
