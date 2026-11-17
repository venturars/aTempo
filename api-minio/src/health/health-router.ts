import { Router, type Request, type Response } from 'express'

import type { HealthResponse } from './health-response'

export type HealthRouterOptions = {
  checkMinio: () => Promise<void>
}

export function createHealthRouter(options: HealthRouterOptions): Router {
  const router = Router()

  router.get('/', async (_request: Request, response: Response) => {
    try {
      await options.checkMinio()
      const body: HealthResponse = { status: 'ok' }
      response.status(200).json(body)
    } catch {
      response.sendStatus(503)
    }
  })

  return router
}