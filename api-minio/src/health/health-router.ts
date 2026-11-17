import { Router, type Request, type Response } from 'express'

import type { HealthResponse } from './health-response'

export function createHealthRouter(): Router {
  const router = Router()

  router.get('/', (_request: Request, response: Response) => {
    const body: HealthResponse = { status: 'ok' }
    response.status(200).json(body)
  })

  return router
}