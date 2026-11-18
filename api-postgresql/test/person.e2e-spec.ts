import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { PostgresService } from '../src/postgres/postgres.service'
import { PersonResponseDto } from '../src/person/person-response.dto'

describe('Person (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    listPersons: () => Promise<PersonResponseDto[]>,
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: async () => undefined,
        listPersons,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app.close()
  })

  it('GET /person returns rows from PostgreSQL', async () => {
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

    await initApp(async () => rows)

    await request(app.getHttpServer()).get('/person').expect(200).expect(rows)
  })

  it('GET /person returns [] when the table is empty', async () => {
    await initApp(async () => [])

    await request(app.getHttpServer()).get('/person').expect(200).expect([])
  })

  it('GET /person returns 503 when PostgreSQL fails', async () => {
    await initApp(async () => {
      throw new Error('connection refused')
    })

    await request(app.getHttpServer()).get('/person').expect(503)
  })
})