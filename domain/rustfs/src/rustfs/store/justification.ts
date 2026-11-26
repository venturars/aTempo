import type {
  GetObjectCommandOutput,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3'
import { fail } from '../../errors'
import type {
  Justification,
  JustificationCreate,
} from '../../types/justification'
import { send } from '../client'
import {
  getJustificationCommand,
  headJustificationCommand,
  headJustificationsBucketCommand,
  putJustificationCommand,
} from '../commands/justification'
import {
  isKeyTakenError,
  isMissingBucketOnHead,
  isMissingKeyOnGet,
  isMissingKeyOnHead,
  rethrowS3,
} from '../map-error'

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

  fail('justification.body', 'not_read')
}

/**
 * Un objeto subido sin Content-Type (por otra herramienta, no por este SDK) se
 * lee como application/octet-stream, el tipo por defecto de un contenido
 * binario. Así la lectura cumple la regla de content_type no vacío.
 */
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

function readContentType(contentType: string | undefined): string {
  return contentType ? contentType : DEFAULT_CONTENT_TYPE
}

function readEtag(etag: string | undefined): string {
  return etag ?? ''
}

export async function justificationKeyExists(id: string): Promise<boolean> {
  try {
    await send(headJustificationCommand(id))
    return true
  } catch (error) {
    if (isMissingKeyOnHead(error)) {
      // El mismo 404 vale para la clave y para el bucket: antes de decir que
      // la clave no existe, se mira si falta el bucket.
      await assertJustificationsBucketIsNotMissing()
      return false
    }
    rethrowS3(error)
  }
}

/**
 * Lanza PersistenceError solo si HeadBucket dice que el bucket no existe (404).
 * Con unas credenciales que solo pueden leer y escribir objetos, HeadBucket da
 * 403: eso no dice nada del bucket y la respuesta del HEAD de la clave vale.
 */
async function assertJustificationsBucketIsNotMissing(): Promise<void> {
  try {
    await send(headJustificationsBucketCommand())
  } catch (error) {
    if (isMissingBucketOnHead(error)) {
      fail('rustfs.bucket', 'missing_bucket', {
        cause: error instanceof Error ? error : undefined,
      })
    }
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
      content_type: readContentType(output.ContentType),
      body: await readBody(output.Body),
      etag: readEtag(output.ETag),
    }
  } catch (error) {
    if (isMissingKeyOnGet(error)) {
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
    if (isKeyTakenError(error)) {
      fail('justification.document_id', 'taken', {
        cause: error instanceof Error ? error : undefined,
      })
    }
    rethrowS3(error)
  }
}
