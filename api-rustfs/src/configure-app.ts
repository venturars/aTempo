import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'

import { openApiDocument } from './openapi/document'

export function configureSwagger(app: Express): void {
  app.get('/docs-json', (_request, response) => {
    response.json(openApiDocument)
  })

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
}