import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Health (e2e)', () => {
  async function createApp(check: () => Promise<void>): Promise<INestApplication<App>> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresService)
      .useValue({ check })
      .compile()

    const app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
    return app
  }

  it('GET /health returns ok when Postgres responds', async () => {
    const app = await createApp(async () => undefined)

    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', postgres: 'ok' })

    await app.close()
  })

  it('GET /health returns 503 when Postgres does not respond', async () => {
    const app = await createApp(async () => {
      throw new Error('Falta DATABASE_URL')
    })

    await request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect({ status: 'error', postgres: 'error' })

    await app.close()
  })
})
