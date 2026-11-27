export type AppErrorCode =
  'VALIDATION' | 'CONFIGURATION' | 'PERSISTENCE' | 'CONFLICT' | 'NOT_FOUND'

export class AppError {
  constructor(
    readonly code: AppErrorCode,
    readonly message: string,
    readonly cause?: unknown,
  ) {}
}
