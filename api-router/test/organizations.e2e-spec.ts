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

describe('Organizations HTTP (e2e)', () => {
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

  it('rejects requests without Bearer', async () => {
    await request(app.getHttpServer()).post('/organizations').send(adminBody).expect(401)
  })

  it('creates an organization and lists its people', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string

    await request(app.getHttpServer())
      .get(`/organizations/${organizationId}`)
      .set(auth)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('Neoland')
        expect(res.body.tax_id).toBe('B87654321')
      })

    const invited = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/people`)
      .set(auth)
      .send({
        first_name: 'Lucía',
        last_name: 'García',
        identification_document: '87654321B',
        email: 'lucia@neoland.example',
        role: 'teacher',
      })
      .expect(201)

    expect(invited.body.roles).toEqual(['teacher'])
    expect(invited.body.invitation_status).toBe('pending')

    const list = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/people`)
      .set(auth)
      .expect(200)

    expect(list.body).toHaveLength(2)
  })

  it('rejects duplicate tax_id on second organization', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const response = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send({
        ...adminBody,
        name: 'Otra',
        email: 'otro@atempo.test',
        identification_document: '11111111C',
      })
      .expect(409)

    expect(response.body.code).toBe('CONFLICT')
  })

  it('does not expose organization dashboard', async () => {
    await request(app.getHttpServer())
      .get('/organization/dashboard')
      .set(auth)
      .expect(404)
  })
})