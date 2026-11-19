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
        listPersons: async () => [],
        listCourses: async () => [],
        listPersonRoles: async () => [],
        listPersonCourses: async () => [],
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

  it('GET /docs-json exposes OpenAPI with /health, /course, /person-role and /person', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)

    expect(response.body.paths).toHaveProperty('/health')
    expect(response.body.paths).toHaveProperty('/person')
    expect(response.body.paths).toHaveProperty('/course')
    expect(response.body.paths).toHaveProperty('/person-role')
    expect(response.body.paths).toHaveProperty('/person-course')
  })

  it('GET /docs-json exposes GET /person-course with its tag', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)

    expect(response.body.paths['/person-course']).toHaveProperty('get')
    expect(response.body.paths['/person-course'].get.tags).toContain(
      'person-course',
    )
  })
})
