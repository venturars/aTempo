import * as Minio from 'minio'

import { rustfsConfigFromEnv, type RustfsConfig } from './rustfs-config'

/** Cliente S3 compatible; RustFS expone la misma API que espera el paquete `minio`. */
export function createRustfsClient(config: RustfsConfig): Minio.Client {
  return new Minio.Client({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  })
}

export async function checkRustfsWithClient(client: Minio.Client): Promise<void> {
  await client.listBuckets()
}

export async function checkRustfsWithDefaultClient(): Promise<void> {
  const client = createRustfsClient(rustfsConfigFromEnv())
  await checkRustfsWithClient(client)
}