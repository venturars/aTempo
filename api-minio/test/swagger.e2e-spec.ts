import request from 'supertest'

import { createApp } from '../src/create-app'

describe('Swagger (e2e)', () => {
  const app = createApp({ checkMinio: async () => undefined })

  it('GET /docs serves Swagger UI', async () => {
    await request(app).get('/docs/').expect(200).expect('content-type', /html/)
  })

  it('GET /docs-json exposes OpenAPI with /health', async () => {
    const response = await request(app).get('/docs-json').expect(200)

    expect(response.body.paths).toHaveProperty('/health')
  })
})