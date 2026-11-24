import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { OrganizationResponseDto } from '../src/organization/organization-response.dto'
import { POSTGRES_MOCK_ORGANIZATIONS } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

describe('Organization (e2e)', () => {
  let app: INestApplication<App>
  const originalDatabaseUrl = process.env.DATABASE_URL
  const originalPostgresMock = process.env.POSTGRES_MOCK

  async function initApp(
    postgres: Partial<Pick<PostgresService, 'listOrganizations'>> = {},
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: async () => undefined,
        listCourses: async () => [],
        listOrganizations:
          postgres.listOrganizations ??
          (async () => POSTGRES_MOCK_ORGANIZATIONS),
        listPersons: async () => [],
        listPersonRoles: async () => [],
        listPersonCourses: async () => [],
        findPersonById: async () => null,
        usesMock: () => true,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  afterEach(async () => {
    await app?.close()

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

  it('GET /organization returns the configured mock organization', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp()

    await request(app.getHttpServer())
      .get('/organization')
      .expect(200)
      .expect(POSTGRES_MOCK_ORGANIZATIONS)
  })

  it('POSTGRES_MOCK forces the mock when DATABASE_URL is present', async () => {
    process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
    process.env.POSTGRES_MOCK = '1'
    await initApp()

    await request(app.getHttpServer())
      .get('/organization')
      .expect(200)
      .expect(POSTGRES_MOCK_ORGANIZATIONS)
  })

  it('GET /organization returns rows from the query layer', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    const rows: OrganizationResponseDto[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Academia Norte',
        tax_id: 'A12345678',
      },
    ]
    await initApp({ listOrganizations: async () => rows })

    await request(app.getHttpServer())
      .get('/organization')
      .expect(200)
      .expect(rows)
  })

  it('GET /organization returns an empty array when there are no rows', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp({ listOrganizations: async () => [] })

    await request(app.getHttpServer()).get('/organization').expect(200).expect([])
  })

  it('GET /organization returns 503 when PostgreSQL fails', async () => {
    await initApp({
      listOrganizations: async () => {
        throw new Error('PostgreSQL unavailable')
      },
    })

    await request(app.getHttpServer()).get('/organization').expect(503)
  })
})
