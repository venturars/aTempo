import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { POSTGRES_MOCK_PERSONS } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'
import { PersonResponseDto } from '../src/person/person-response.dto'

describe('Person (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    postgres: Partial<Pick<PostgresService, 'check' | 'listPersons'>>,
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: postgres.check ?? (async () => undefined),
        listPersons:
          postgres.listPersons ??
          (async () => POSTGRES_MOCK_PERSONS),
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

  it('GET /person returns postgres mock data by default', async () => {
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
      .get('/person')
      .expect(200)
      .expect(POSTGRES_MOCK_PERSONS)
  })

  it('GET /person returns rows from the query layer', async () => {
    const rows: PersonResponseDto[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        identification_document: '12345678A',
        email: 'ada@example.test',
        first_name: 'Ada',
        last_name: 'López',
        birth_date: '2000-01-15',
        phone: '+34600000000',
      },
    ]

    await initApp({ listPersons: async () => rows })

    await request(app.getHttpServer()).get('/person').expect(200).expect(rows)
  })

  it('GET /person returns 503 when PostgreSQL fails', async () => {
    await initApp({
      listPersons: async () => {
        throw new Error('connection refused')
      },
    })

    await request(app.getHttpServer()).get('/person').expect(503)
  })
})