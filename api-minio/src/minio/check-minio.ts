import * as Minio from 'minio'

import { minioConfigFromEnv, type MinioConfig } from './minio-config'

export function createMinioClient(config: MinioConfig): Minio.Client {
  return new Minio.Client({
    endPoint: config.endPoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  })
}

export async function checkMinioWithClient(client: Minio.Client): Promise<void> {
  await client.listBuckets()
}

export async function checkMinioWithDefaultClient(): Promise<void> {
  const client = createMinioClient(minioConfigFromEnv())
  await checkMinioWithClient(client)
}