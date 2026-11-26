import {
  assertBytes,
  assertNonEmptyString,
  assertObject,
  assertString,
  assertUuid,
  normalizeUuid,
} from './assert'

export type JustificationCreate = {
  document_id: string
  content_type: string
  body: Uint8Array
}

export type Justification = JustificationCreate & { etag: string }

export function assertJustificationCreate(
  value: JustificationCreate,
): JustificationCreate {
  assertObject(value, 'justification')
  assertUuid(value.document_id, 'justification.document_id')
  assertNonEmptyString(value.content_type, 'justification.content_type')
  assertBytes(value.body, 'justification.body')
  return {
    document_id: normalizeUuid(value.document_id),
    content_type: value.content_type,
    body: value.body,
  }
}

export function assertJustification(value: Justification): Justification {
  const created = assertJustificationCreate(value)
  assertString(value.etag, 'justification.etag')
  return {
    ...created,
    etag: value.etag,
  }
}
