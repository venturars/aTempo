import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { CourseResponseDto } from '../src/course/course-response.dto'
import { POSTGRES_MOCK_COURSES } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Course (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    postgres: Partial<Pick<PostgresService, 'check' | 'listCourses'>>,
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: postgres.check ?? (async () => undefined),
        listCourses:
          postgres.listCourses ?? (async () => POSTGRES_MOCK_COURSES),
        usesMock: () => true,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app?.close()
  })

  it('GET /course returns postgres mock data by default', async () => {
    delete process.env.DATABASE_URL
    if (process.env.POSTGRES_MOCK) {
      delete process.env.POSTGRES_MOCK
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()

    await request(app.getHttpServer())
      .get('/course')
      .expect(200)
      .expect(POSTGRES_MOCK_COURSES)
  })

  it('GET /course returns rows from the query layer', async () => {
    const rows: CourseResponseDto[] = [
      {
        id: '22222222-2222-2222-2222-222222222222',
        organization_id: '11111111-1111-1111-1111-111111111111',
        name: 'Curso de prueba',
        acronym: 'CP',
        start_at: '2026-09-01T08:00:00.000Z',
        end_at: '2027-06-30T17:00:00.000Z',
        contract_address: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
      },
    ]

    await initApp({ listCourses: async () => rows })

    await request(app.getHttpServer()).get('/course').expect(200).expect(rows)
  })

  it('GET /course returns an empty array when there are no rows', async () => {
    await initApp({ listCourses: async () => [] })

    await request(app.getHttpServer()).get('/course').expect(200).expect([])
  })

  it('GET /course returns 503 when PostgreSQL fails', async () => {
    await initApp({
      listCourses: async () => {
        throw new Error('connection refused')
      },
    })

    await request(app.getHttpServer()).get('/course').expect(503)
  })
})
