export type MinioConfig = {
  endPoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
}

function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue
  }
  return value === 'true' || value === '1'
}

export function minioConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): MinioConfig {
  return {
    endPoint: env.MINIO_ENDPOINT ?? '127.0.0.1',
    port: Number(env.MINIO_PORT ?? '9000'),
    useSSL: readBoolean(env.MINIO_USE_SSL, false),
    accessKey: env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: env.MINIO_SECRET_KEY ?? 'minioadmin',
  }
}