import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { POSTGRES_MOCK_PERSON_COURSES } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Person course (e2e)', () => {
  let app: INestApplication<App>
  const originalDatabaseUrl = process.env.DATABASE_URL
  const originalPostgresMock = process.env.POSTGRES_MOCK

  async function initApp(
    postgresService?: Partial<PostgresService>,
  ): Promise<void> {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    })

    if (postgresService) {
      moduleBuilder.overrideProvider(PostgresService).useValue(postgresService)
    }

    const moduleFixture: TestingModule = await moduleBuilder.compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app.close()

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl
    }

    if (originalPostgresMock === undefined) {
      delete process.env.POSTGRES_MOCK
    } else {
      process.env.POSTGRES_MOCK = originalPostgresMock
    }
  })

  it('returns the fixed mock when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp()

    await request(app.getHttpServer())
      .get('/person-course')
      .expect(200)
      .expect(POSTGRES_MOCK_PERSON_COURSES)
  })

  it('POSTGRES_MOCK forces the mock when DATABASE_URL is present', async () => {
    process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
    process.env.POSTGRES_MOCK = '1'
    await initApp()

    await request(app.getHttpServer())
      .get('/person-course')
      .expect(200)
      .expect(POSTGRES_MOCK_PERSON_COURSES)
  })

  it('returns database rows as an array', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    const rows = [
      {
        person_id: '8c540e7a-5e8e-4744-9896-e6159dbd0c72',
        course_id: 'a84c351e-80d1-4408-8d29-7915164ed167',
      },
    ]
    await initApp({ listPersonCourses: async () => rows })

    await request(app.getHttpServer())
      .get('/person-course')
      .expect(200)
      .expect(rows)
  })

  it('returns an empty array when the table has no rows', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp({ listPersonCourses: async () => [] })

    await request(app.getHttpServer())
      .get('/person-course')
      .expect(200)
      .expect([])
  })

  it('returns 503 when the real database query fails', async () => {
    process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
    delete process.env.POSTGRES_MOCK
    await initApp({
      listPersonCourses: async () => {
        throw new Error('PostgreSQL unavailable')
      },
    })

    await request(app.getHttpServer()).get('/person-course').expect(503)
  })
})
