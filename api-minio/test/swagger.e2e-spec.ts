import { createApp } from '../src/create-app'
import {
  closeTestServer,
  requestOnServer,
  startTestServer,
} from './helpers/test-server'

describe('Swagger (e2e)', () => {
  let server: ReturnType<typeof startTestServer>

  beforeEach(() => {
    const app = createApp({ checkMinio: async () => {} })
    server = startTestServer(app)
  })

  afterEach(async () => {
    await closeTestServer(server)
  })

  it('GET /docs serves Swagger UI', async () => {
    await requestOnServer(server)
      .get('/docs/')
      .expect(200)
      .expect('content-type', /html/)
  })

  it('GET /docs-json exposes OpenAPI with /health', async () => {
    const response = await requestOnServer(server).get('/docs-json').expect(200)

    expect(response.body.paths).toHaveProperty('/health')
  })
})