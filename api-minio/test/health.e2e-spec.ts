import { createApp } from '../src/create-app'
import {
  closeTestServer,
  requestOnServer,
  startTestServer,
} from './helpers/test-server'

describe('Health (e2e)', () => {
  it('GET /health returns ok when MinIO check passes', async () => {
    const app = createApp({ checkMinio: async () => {} })
    const server = startTestServer(app)

    try {
      await requestOnServer(server)
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' })
    } finally {
      await closeTestServer(server)
    }
  })

  it('GET /health returns 503 when MinIO check fails', async () => {
    const app = createApp({
      checkMinio: async () => {
        throw new Error('minio unreachable')
      },
    })
    const server = startTestServer(app)

    try {
      await requestOnServer(server).get('/health').expect(503)
    } finally {
      await closeTestServer(server)
    }
  })
})