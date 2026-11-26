import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

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

  it('GET /docs-json exposes the public health and authentication endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)

    expect(response.body.paths).toHaveProperty('/health')
    expect(response.body.paths).toHaveProperty('/auth/login')
    expect(response.body.paths).toHaveProperty('/auth/me')
    expect(response.body.paths).toHaveProperty('/auth/register')
    expect(response.body.paths).toHaveProperty('/auth/logout')
    expect(response.body.paths).toHaveProperty('/auth/refresh')
    expect(response.body.paths).not.toHaveProperty('/auth/web/login')
    expect(response.body.paths).not.toHaveProperty('/auth/web/session')
    expect(response.body.paths).not.toHaveProperty('/auth/web/logout')
  })
})
