import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

export const JUSTIFICATIONS_BUCKET = 'justifications'

export function headJustificationsBucketCommand(): HeadBucketCommand {
  return new HeadBucketCommand({ Bucket: JUSTIFICATIONS_BUCKET })
}

export function headJustificationCommand(key: string): HeadObjectCommand {
  return new HeadObjectCommand({
    Bucket: JUSTIFICATIONS_BUCKET,
    Key: key,
  })
}

export function getJustificationCommand(key: string): GetObjectCommand {
  return new GetObjectCommand({
    Bucket: JUSTIFICATIONS_BUCKET,
    Key: key,
  })
}

export function putJustificationCommand(
  key: string,
  body: Uint8Array,
  contentType: string,
): PutObjectCommand {
  return new PutObjectCommand({
    Bucket: JUSTIFICATIONS_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Escritura condicional: RustFS solo crea el objeto si la clave no existe.
    // Si dos subidas llegan a la vez, la segunda recibe 412 y no sobrescribe.
    IfNoneMatch: '*',
  })
}
