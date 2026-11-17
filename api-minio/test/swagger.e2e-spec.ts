import request from 'supertest'
import type { App } from 'supertest/types'

import { createApp } from '../src/create-app'

describe('Swagger (e2e)', () => {
  const app = createApp({ checkMinio: async () => {} })
  const agent = request(app as unknown as App)

  it('GET /docs serves Swagger UI', async () => {
    await agent.get('/docs/').expect(200).expect('content-type', /html/)
  })

  it('GET /docs-json exposes OpenAPI with /health', async () => {
    const response = await agent.get('/docs-json').expect(200)

    expect(response.body.paths).toHaveProperty('/health')
  })
})