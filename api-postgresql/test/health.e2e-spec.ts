import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Health (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(check: () => Promise<void>): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresService)
      .useValue({ check })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app.close()
  })

  it('GET /health returns ok when Postgres responds', async () => {
    await initApp(async () => undefined)

    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', postgres: 'ok' })
  })

  it('GET /health returns 503 when Postgres does not respond', async () => {
    await initApp(async () => {
      throw new Error('Falta DATABASE_URL')
    })

    await request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect({ status: 'error', postgres: 'error' })
  })
})