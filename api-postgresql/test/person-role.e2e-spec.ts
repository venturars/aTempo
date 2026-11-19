import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { POSTGRES_MOCK_PERSON_ROLES } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'
import { PersonRoleResponseDto } from '../src/person-role/person-role-response.dto'

describe('PersonRole (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    postgres: Partial<Pick<PostgresService, 'check' | 'listPersonRoles'>>,
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: postgres.check ?? (async () => undefined),
        listCourses: async () => [],
        listPersonRoles:
          postgres.listPersonRoles ??
          (async () => POSTGRES_MOCK_PERSON_ROLES),
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

  it('GET /person-role returns postgres mock data by default', async () => {
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
      .get('/person-role')
      .expect(200)
      .expect(POSTGRES_MOCK_PERSON_ROLES)
  })

  it('GET /person-role returns rows from the query layer', async () => {
    const rows: PersonRoleResponseDto[] = [
      {
        person_id: '11111111-1111-1111-1111-111111111111',
        role: 'student',
      },
    ]

    await initApp({ listPersonRoles: async () => rows })

    await request(app.getHttpServer())
      .get('/person-role')
      .expect(200)
      .expect(rows)
  })

  it('GET /person-role returns 503 when PostgreSQL fails', async () => {
    await initApp({
      listPersonRoles: async () => {
        throw new Error('connection refused')
      },
    })

    await request(app.getHttpServer()).get('/person-role').expect(503)
  })
})