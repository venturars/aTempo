import express, { type Express } from 'express'

import { configureSwagger } from './configure-app'
import { createHealthRouter } from './health/health-router'

export function createApp(): Express {
  const app = express()

  app.use('/health', createHealthRouter())
  configureSwagger(app)

  return app
}