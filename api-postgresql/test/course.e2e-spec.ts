import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { CourseResponseDto } from '../src/course/course-response.dto'
import {
  POSTGRES_MOCK_COURSES,
  POSTGRES_MOCK_ORGANIZATIONS,
} from '../src/postgres/postgres-mock'
import { PostgresService } from '../src/postgres/postgres.service'

const MOCK_COURSE = POSTGRES_MOCK_COURSES[0]!
const UNKNOWN_COURSE_ID = '22222222-2222-2222-2222-222222222222'
const newCourseBody = {
  organization_id: POSTGRES_MOCK_ORGANIZATIONS[0]!.id,
  name: 'Francés A2',
  acronym: 'A2',
  start_at: '2026-01-01T09:00:00.000Z',
  end_at: '2026-06-30T18:00:00.000Z',
  contract_address: '0x0000000000000000000000000000000000000001',
}

describe('Course (e2e)', () => {
  let app: INestApplication<App>

  async function initApp(
    postgres: Partial<
      Pick<
        PostgresService,
        | 'check'
        | 'listCourses'
        | 'findCourseById'
        | 'insertCourse'
        | 'updateCourse'
        | 'deleteCourse'
      >
    > = {},
  ): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostgresService)
      .useValue({
        check: postgres.check ?? (async () => undefined),
        listCourses:
          postgres.listCourses ?? (async () => POSTGRES_MOCK_COURSES),
        findCourseById: postgres.findCourseById,
        insertCourse: postgres.insertCourse,
        updateCourse: postgres.updateCourse,
        deleteCourse: postgres.deleteCourse,
        listPersonRoles: async () => [],
        usesMock: () => true,
      })
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  }

  async function initAppWithBuiltInMock(): Promise<void> {
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

  it('creates, reads, patches and deletes a course', async () => {
    await initAppWithBuiltInMock()

    const listed = await request(app.getHttpServer())
      .get('/course')
      .expect(200)
    expect(listed.body).toEqual(POSTGRES_MOCK_COURSES)

    const created = await request(app.getHttpServer())
      .post('/course')
      .send(newCourseBody)
      .expect(201)

    expect(created.body).toMatchObject(newCourseBody)
    expect(created.body.id).toEqual(expect.any(String))

    await request(app.getHttpServer())
      .get(`/course/${MOCK_COURSE.id}`)
      .expect(200)
      .expect(MOCK_COURSE)

    const patched = await request(app.getHttpServer())
      .patch(`/course/${MOCK_COURSE.id}`)
      .send({ name: 'Curso de prueba' })
      .expect(200)

    expect(patched.body).toMatchObject({
      id: MOCK_COURSE.id,
      organization_id: MOCK_COURSE.organization_id,
      name: 'Curso de prueba',
    })

    await request(app.getHttpServer())
      .delete(`/course/${MOCK_COURSE.id}`)
      .expect(204)

    await request(app.getHttpServer())
      .get(`/course/${UNKNOWN_COURSE_ID}`)
      .expect(404)
  })

  it('returns 404 for an unknown course id', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer())
      .get(`/course/${UNKNOWN_COURSE_ID}`)
      .expect(404)

    await request(app.getHttpServer())
      .patch(`/course/${UNKNOWN_COURSE_ID}`)
      .send({ name: 'Curso de prueba' })
      .expect(404)

    await request(app.getHttpServer())
      .delete(`/course/${UNKNOWN_COURSE_ID}`)
      .expect(404)
  })

  it('returns 400 when the id is not a uuid', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer()).get('/course/abc').expect(400)
    await request(app.getHttpServer())
      .patch('/course/abc')
      .send({ name: 'Curso de prueba' })
      .expect(400)

    await request(app.getHttpServer()).delete('/course/abc').expect(400)
  })

  it('returns 503 when postgres throws', async () => {
    await initApp({
      findCourseById: async () => {
        throw new Error('connection refused')
      },
      insertCourse: async () => {
        throw new Error('connection refused')
      },
      updateCourse: async () => {
        throw new Error('connection refused')
      },
      deleteCourse: async () => {
        throw new Error('connection refused')
      },
    })

    await request(app.getHttpServer())
      .get(`/course/${UNKNOWN_COURSE_ID}`)
      .expect(503)

    await request(app.getHttpServer())
      .post('/course')
      .send(newCourseBody)
      .expect(503)

    await request(app.getHttpServer())
      .patch(`/course/${UNKNOWN_COURSE_ID}`)
      .send({ name: 'Curso de prueba' })
      .expect(503)

    await request(app.getHttpServer())
      .delete(`/course/${UNKNOWN_COURSE_ID}`)
      .expect(503)
  })

  it('returns 409 on unique violation', async () => {
    await initApp({
      insertCourse: async () => {
        throw Object.assign(new Error('unique violation'), { code: '23505' })
      },
      updateCourse: async () => {
        throw Object.assign(new Error('unique violation'), { code: '23505' })
      },
    })

    await request(app.getHttpServer())
      .post('/course')
      .send(newCourseBody)
      .expect(409)

    await request(app.getHttpServer())
      .patch(`/course/${UNKNOWN_COURSE_ID}`)
      .send({ acronym: 'string' })
      .expect(409)
  })

  it('returns 404 when the organization is missing', async () => {
    delete process.env.DATABASE_URL
    if (process.env.POSTGRES_MOCK) {
      delete process.env.POSTGRES_MOCK
    }
    await initApp({
      insertCourse: async () => {
        throw Object.assign(new Error('foreign key'), { code: '23503' })
      },
    })

    const missingOrganizationId = '11111111-1111-4111-8111-111111111111'

    await request(app.getHttpServer())
      .post('/course')
      .send({
        ...newCourseBody,
        organization_id: missingOrganizationId,
      })
      .expect(404)
  })

  it('POST /course returns 400 when name or acronym is empty', async () => {
    await initAppWithBuiltInMock()

    await request(app.getHttpServer())
      .post('/course')
      .send({ ...newCourseBody, name: '   ' })
      .expect(400)

    await request(app.getHttpServer())
      .post('/course')
      .send({ ...newCourseBody, acronym: '' })
      .expect(400)
  })
})
