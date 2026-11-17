import express, { type Express } from 'express'

import { configureSwagger } from './configure-app'
import { createHealthRouter } from './health/health-router'

export type CreateAppOptions = {
  checkMinio: () => Promise<void>
}

export function createApp(options: CreateAppOptions): Express {
  const app = express()

  app.use('/health', createHealthRouter({ checkMinio: options.checkMinio }))
  configureSwagger(app)

  return app
}