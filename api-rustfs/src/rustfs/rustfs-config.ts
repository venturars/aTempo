export type RustfsConfig = {
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

export function rustfsConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): RustfsConfig {
  return {
    endPoint: env.RUSTFS_ENDPOINT ?? '127.0.0.1',
    port: Number(env.RUSTFS_PORT ?? '9000'),
    useSSL: readBoolean(env.RUSTFS_USE_SSL, false),
    accessKey: env.RUSTFS_ACCESS_KEY ?? 'rustfsadmin',
    secretKey: env.RUSTFS_SECRET_KEY ?? 'rustfsadmin',
  }
}