import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PersonResponseDto } from '../src/person/person-response.dto'
import { POSTGRES_MOCK_PERSONS } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

const MOCK_PERSON = POSTGRES_MOCK_PERSONS[0]
const UNKNOWN_UUID = '22222222-2222-2222-2222-222222222222'

describe('Person (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    postgres: Partial<Pick<PostgresService, 'listPersons' | 'findPersonById'>>,
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: async () => undefined,
        listCourses: async () => [],
        listPersonRoles: async () => [],
        listPersons: postgres.listPersons ?? (async () => POSTGRES_MOCK_PERSONS),
        findPersonById: postgres.findPersonById ?? (async () => null),
        usesMock: () => true,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  async function initAppWithBuiltInMock(): Promise<void> {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app?.close()
  })

  it('GET /person returns postgres mock data by default', async () => {
    await initAppWithBuiltInMock()

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

  it('GET /person/:id returns the postgres mock person by default', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer())
      .get(`/person/${MOCK_PERSON.id}`)
      .expect(200)
      .expect(MOCK_PERSON)
  })

  it('GET /person/:id returns 404 for another valid UUID in the mock', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer())
      .get(`/person/${UNKNOWN_UUID}`)
      .expect(404)
  })

  it('GET /person/:id returns 400 when the id is not a UUID', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer()).get('/person/abc').expect(400)
  })

  it('GET /person/:id returns the row from the query layer', async () => {
    const row: PersonResponseDto = {
      id: UNKNOWN_UUID,
      identification_document: '12345678Z',
      email: 'ana@example.test',
      first_name: 'Ana',
      last_name: 'Pérez',
      birth_date: null,
      phone: null,
    }

    await initApp({ findPersonById: async () => row })

    await request(app.getHttpServer())
      .get(`/person/${UNKNOWN_UUID}`)
      .expect(200)
      .expect(row)
  })

  it('GET /person/:id returns 404 when there is no row', async () => {
    await initApp({ findPersonById: async () => null })

    await request(app.getHttpServer())
      .get(`/person/${UNKNOWN_UUID}`)
      .expect(404)
  })

  it('GET /person/:id returns 503 when PostgreSQL fails', async () => {
    await initApp({
      findPersonById: async () => {
        throw new Error('connection refused')
      },
    })

    await request(app.getHttpServer())
      .get(`/person/${UNKNOWN_UUID}`)
      .expect(503)
  })
})
