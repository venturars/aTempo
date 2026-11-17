import request from 'supertest'

import { createApp } from '../src/create-app'

describe('Health (e2e)', () => {
  it('GET /health returns ok when MinIO check passes', async () => {
    const app = createApp({ checkMinio: async () => undefined })

    await request(app).get('/health').expect(200).expect({ status: 'ok' })
  })

  it('GET /health returns 503 when MinIO check fails', async () => {
    const app = createApp({
      checkMinio: async () => {
        throw new Error('minio unreachable')
      },
    })

    await request(app).get('/health').expect(503)
  })
})