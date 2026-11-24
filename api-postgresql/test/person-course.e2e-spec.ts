import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { POSTGRES_MOCK_PERSON_COURSES } from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

const MOCK_ENROLLMENT = POSTGRES_MOCK_PERSON_COURSES[0]
const UNKNOWN_PERSON_ID = '22222222-2222-2222-2222-222222222222'
const UNKNOWN_COURSE_ID = '33333333-3333-3333-3333-333333333333'

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

  it('DELETE mock enrollment returns 204 when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp()

    await request(app.getHttpServer())
      .delete(
        `/person-course/${MOCK_ENROLLMENT.person_id}/${MOCK_ENROLLMENT.course_id}`,
      )
      .expect(204)

    const listed = await request(app.getHttpServer())
      .get('/person-course')
      .expect(200)
    // el mock no cambia: el DELETE no borra nada en memoria
    expect(listed.body).toEqual(POSTGRES_MOCK_PERSON_COURSES)
  })

  it('DELETE POSTGRES_MOCK enrollment returns 204 when DATABASE_URL is present', async () => {
    process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
    process.env.POSTGRES_MOCK = '1'
    await initApp()

    await request(app.getHttpServer())
      .delete(
        `/person-course/${MOCK_ENROLLMENT.person_id}/${MOCK_ENROLLMENT.course_id}`,
      )
      .expect(204)
  })

  it('DELETE another valid UUID pair returns 404 in the mock', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp()

    await request(app.getHttpServer())
      .delete(`/person-course/${UNKNOWN_PERSON_ID}/${UNKNOWN_COURSE_ID}`)
      .expect(404)
  })

  it('DELETE returns 400 when a param is not a UUID', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp()

    await request(app.getHttpServer())
      .delete(`/person-course/abc/${MOCK_ENROLLMENT.course_id}`)
      .expect(400)

    await request(app.getHttpServer())
      .delete(`/person-course/${MOCK_ENROLLMENT.person_id}/abc`)
      .expect(400)
  })

  it('DELETE returns 204 when the query layer deletes a row', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp({
      deletePersonCourse: async () => ({
        person_id: UNKNOWN_PERSON_ID,
        course_id: UNKNOWN_COURSE_ID,
      }),
    })

    await request(app.getHttpServer())
      .delete(`/person-course/${UNKNOWN_PERSON_ID}/${UNKNOWN_COURSE_ID}`)
      .expect(204)
  })

  it('DELETE returns 404 when the query layer finds no row', async () => {
    delete process.env.DATABASE_URL
    delete process.env.POSTGRES_MOCK
    await initApp({ deletePersonCourse: async () => null })

    await request(app.getHttpServer())
      .delete(`/person-course/${UNKNOWN_PERSON_ID}/${UNKNOWN_COURSE_ID}`)
      .expect(404)
  })

  it('DELETE returns 503 when the real database query fails', async () => {
    process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
    delete process.env.POSTGRES_MOCK
    await initApp({
      deletePersonCourse: async () => {
        throw new Error('PostgreSQL unavailable')
      },
    })

    await request(app.getHttpServer())
      .delete(`/person-course/${UNKNOWN_PERSON_ID}/${UNKNOWN_COURSE_ID}`)
      .expect(503)
  })

  describe('POST /person-course', () => {
    const mockPair = POSTGRES_MOCK_PERSON_COURSES[0]
    const otherPair = {
      person_id: '8c540e7a-5e8e-4744-9896-e6159dbd0c72',
      course_id: 'a84c351e-80d1-4408-8d29-7915164ed167',
    }

    it('returns 201 for a new pair when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp()

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(201)
        .expect(otherPair)

      const listed = await request(app.getHttpServer())
        .get('/person-course')
        .expect(200)
      // el mock no cambia: el POST no guarda nada en memoria
      expect(listed.body).toEqual(POSTGRES_MOCK_PERSON_COURSES)
    })

    it('returns 409 for the fixed mock pair when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp()

      await request(app.getHttpServer())
        .post('/person-course')
        .send(mockPair)
        .expect(409)
    })

    it('POSTGRES_MOCK returns 201 for a new pair and 409 for the fixed pair', async () => {
      process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
      process.env.POSTGRES_MOCK = '1'
      await initApp()

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(201)
        .expect(otherPair)

      await request(app.getHttpServer())
        .post('/person-course')
        .send(mockPair)
        .expect(409)
    })

    it('returns 400 when the body is empty', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp()

      await request(app.getHttpServer()).post('/person-course').send({}).expect(400)
    })

    it('returns 400 when an id is not a UUID', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp()

      await request(app.getHttpServer())
        .post('/person-course')
        .send({ person_id: 'not-a-uuid', course_id: otherPair.course_id })
        .expect(400)
    })

    it('returns 400 when the body is not JSON', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp()

      await request(app.getHttpServer())
        .post('/person-course')
        .set('Content-Type', 'application/json')
        .send('not-json')
        .expect(400)
    })

    it('returns 201 when the service inserts the row', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp({
        createPersonCourse: async (personId, courseId) => ({
          person_id: personId,
          course_id: courseId,
        }),
      })

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(201)
        .expect(otherPair)
    })

    it('returns 404 when Postgres reports a missing foreign key', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp({
        createPersonCourse: async () => {
          throw Object.assign(new Error('foreign key'), { code: '23503' })
        },
      })

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(404)
    })

    it('returns 409 when Postgres reports a duplicate pair', async () => {
      delete process.env.DATABASE_URL
      delete process.env.POSTGRES_MOCK
      await initApp({
        createPersonCourse: async () => {
          throw Object.assign(new Error('unique violation'), { code: '23505' })
        },
      })

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(409)
    })

    it('returns 503 when the real insert fails', async () => {
      process.env.DATABASE_URL = 'postgres://unused:unused@127.0.0.1:1/unused'
      delete process.env.POSTGRES_MOCK
      await initApp({
        createPersonCourse: async () => {
          throw new Error('PostgreSQL unavailable')
        },
      })

      await request(app.getHttpServer())
        .post('/person-course')
        .send(otherPair)
        .expect(503)
    })
  })
})
