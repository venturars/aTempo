import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'

const auth = { Authorization: 'Bearer test-token' }

const dashboardKeys = [
  'organization',
  'period',
  'profile',
  'reviewStudentCount',
  'provisional',
  'courses',
  'students',
  'pending',
  'quality',
]

describe('Organization dashboard HTTP (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns OrganizationDashboard shape by default', async () => {
    const response = await request(app.getHttpServer())
      .get('/organization/dashboard')
      .set(auth)
      .expect(200)

    for (const key of dashboardKeys) {
      expect(response.body).toHaveProperty(key)
    }
    expect(response.body.organization).toBe('Academia Horizonte')
    expect(response.body.courses.length).toBeGreaterThan(0)
  })

  it('returns empty and incomplete fixtures', async () => {
    const empty = await request(app.getHttpServer())
      .get('/organization/dashboard?fixture=empty')
      .set(auth)
      .expect(200)

    expect(empty.body.courses).toEqual([])
    expect(empty.body.students).toEqual([])
    expect(empty.body.reviewStudentCount).toBe(0)

    const incomplete = await request(app.getHttpServer())
      .get('/organization/dashboard?fixture=incomplete')
      .set(auth)
      .expect(200)

    expect(incomplete.body.courses[0].absences.count).toBeNull()
  })

  it('rejects missing Bearer', async () => {
    await request(app.getHttpServer()).get('/organization/dashboard').expect(401)
  })
})