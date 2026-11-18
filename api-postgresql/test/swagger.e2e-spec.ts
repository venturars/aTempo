import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: async () => undefined,
        listPersonRoles: async () => [],
        usesMock: () => true,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /docs serves Swagger UI', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('content-type', /html/)
  })

  it('GET /docs-json exposes OpenAPI with /health and /person-role', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)

    expect(response.body.paths).toHaveProperty('/health')
    expect(response.body.paths).toHaveProperty('/person-role')
  })
})