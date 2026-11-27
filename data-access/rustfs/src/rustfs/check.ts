import { HeadBucketCommand } from '@aws-sdk/client-s3'
import { send } from './client'
import { JUSTIFICATIONS_BUCKET } from './commands/justification'
import { rethrowS3 } from './map-error'

export async function check(): Promise<{ ok: true }> {
  try {
    await send(
      new HeadBucketCommand({
        Bucket: JUSTIFICATIONS_BUCKET,
      }),
    )
    return { ok: true }
  } catch (error) {
    rethrowS3(error)
  }
}
