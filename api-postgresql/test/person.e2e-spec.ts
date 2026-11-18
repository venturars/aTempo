import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PostgresService } from '../src/postgres/postgres.service'
import { PERSON_DEMO } from '../src/person/person-demo'

describe('Person (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({ check: async () => undefined })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /person returns fixed demo data', async () => {
    await request(app.getHttpServer()).get('/person').expect(200).expect(PERSON_DEMO)
  })

  it('GET /person returns demo shape from issue #32', async () => {
    const response = await request(app.getHttpServer()).get('/person').expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toMatchObject({
      id: expect.any(String),
      identification_document: expect.any(String),
      email: expect.any(String),
      first_name: expect.any(String),
      last_name: expect.any(String),
      birth_date: expect.any(String),
      phone: expect.any(String),
    })
  })
})