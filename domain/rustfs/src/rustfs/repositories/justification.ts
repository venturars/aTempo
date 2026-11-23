import type {
  GetObjectCommandOutput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3'
import { PersistenceError } from '../../errors'
import type {
  Justification,
  JustificationCreate,
} from '../../types/justification'
import { send } from '../client'
import {
  getJustificationCommand,
  headJustificationCommand,
  putJustificationCommand,
} from '../commands/justification'
import { isMissingKeyError, rethrowS3 } from '../map-error'

async function readBody(body: unknown): Promise<Uint8Array> {
  if (body == null) {
    return new Uint8Array()
  }
  if (body instanceof Uint8Array) {
    return body
  }
  if (
    typeof body === 'object' &&
    'transformToByteArray' in body &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray ===
      'function'
  ) {
    const bytes = await (
      body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray()
    if (bytes instanceof Uint8Array) {
      return bytes
    }
  }

  throw new PersistenceError('justification.body no se ha leído', {
    entity: 'justification',
    field: 'body',
  })
}

function readEtag(etag: string | undefined): string {
  return etag ?? ''
}

export async function justificationKeyExists(id: string): Promise<boolean> {
  try {
    await send(headJustificationCommand(id))
    return true
  } catch (error) {
    if (isMissingKeyError(error)) {
      return false
    }
    rethrowS3(error)
  }
}

export async function findJustificationById(
  id: string,
): Promise<Justification | null> {
  try {
    const output = await send<GetObjectCommandOutput>(
      getJustificationCommand(id),
    )
    return {
      document_id: id,
      content_type: output.ContentType ?? '',
      body: await readBody(output.Body),
      etag: readEtag(output.ETag),
    }
  } catch (error) {
    if (isMissingKeyError(error)) {
      return null
    }
    rethrowS3(error)
  }
}

export async function insertJustification(
  justification: JustificationCreate,
): Promise<Justification> {
  try {
    const output = await send<PutObjectCommandOutput>(
      putJustificationCommand(
        justification.document_id,
        justification.body,
        justification.content_type,
      ),
    )
    return {
      document_id: justification.document_id,
      content_type: justification.content_type,
      body: justification.body,
      etag: readEtag(output.ETag),
    }
  } catch (error) {
    rethrowS3(error)
  }
}
