import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { createSdk } from 'atempo-sdk'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { ATEMPO_SDK } from '../src/shared/atempo-sdk.token'
import { configureApp } from '../src/configure-app'

const auth = { Authorization: 'Bearer test-token' }

const adminBody = {
  name: 'Neoland',
  tax_id: 'B87654321',
  first_name: 'Ventura',
  last_name: 'Rodríguez',
  identification_document: '12345678A',
  email: 'profesor@atempo.test',
}

const courseBody = {
  name: 'Inglés B1',
  acronym: 'B1',
  start_at: '2026-01-01T09:00:00.000Z',
  end_at: '2026-06-30T18:00:00.000Z',
  contract_address: '0x0000000000000000000000000000000000000001',
}

describe('Courses HTTP (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ATEMPO_SDK)
      .useValue(createSdk())
      .compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('creates a course and enrolls a student', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string

    const invited = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/people`)
      .set(auth)
      .send({
        first_name: 'Ada',
        last_name: 'López',
        identification_document: '11223344C',
        email: 'ada.lopez@clase.test',
        role: 'student',
      })
      .expect(201)

    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    expect(course.body.acronym).toBe('B1')

    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses/${course.body.id}/people`)
      .set(auth)
      .send({ person_id: invited.body.id })
      .expect(201)

    const list = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses/${course.body.id}/people`)
      .set(auth)
      .expect(200)

    expect(list.body).toHaveLength(1)
    expect(list.body[0].id).toBe(invited.body.id)
  })

  it('rejects course routes without Bearer', async () => {
    await request(app.getHttpServer())
      .post('/organizations/foo/courses')
      .send(courseBody)
      .expect(401)
  })
})