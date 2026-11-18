import request from 'supertest'
import type { App } from 'supertest/types'

import { createApp } from '../src/create-app'

describe('Health (e2e)', () => {
  it('GET /health returns ok', () => {
    const app = createApp()

    return request(app as unknown as App)
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' })
  })
})