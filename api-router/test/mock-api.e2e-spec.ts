import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { configureApp } from '../src/configure-app'
import { MockApiModule } from '../src/mock-api/mock-api.module'
import { sampleDay } from '../src/mock-api/sample-data'

describe('Mock API v1 (e2e)', () => {
  let app: INestApplication<App>
  const today = sampleDay()
  const sessionId = `session-${today}`
  const studentId = 'student-victor-chang'

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MockApiModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApp(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET /sessions lists the sample session of today', async () => {
    const response = await request(app.getHttpServer())
      .get(`/sessions?date=${today}`)
      .expect(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toMatchObject({
      id: sessionId,
      courseId: 'course-ai-engineering',
      state: 'scheduled',
      lateMinutes: 10,
    })
  })

  it('GET /sessions rejects a malformed date with VALIDATION_FAILED', async () => {
    const response = await request(app.getHttpServer())
      .get('/sessions?date=23-11-2026')
      .expect(400)
    expect(response.body).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      code: 'VALIDATION_FAILED',
      message: 'La petición no es válida.',
      details: [
        { field: 'date', message: 'La fecha tiene que ser AAAA-MM-DD.' },
      ],
    })
  })

  it('GET /sessions/:sessionId answers 404 SESSION_NOT_FOUND', async () => {
    const response = await request(app.getHttpServer())
      .get('/sessions/session-unknown')
      .expect(404)
    expect(response.body.code).toBe('SESSION_NOT_FOUND')
  })

  it('opens, serves a code, corrects and closes a session', async () => {
    const server = app.getHttpServer()

    const opened = await request(server)
      .post(`/sessions/${sessionId}/open`)
      .expect(200)
    expect(opened.body.state).toBe('open')

    const attendances = await request(server)
      .get(`/sessions/${sessionId}/attendances`)
      .expect(200)
    expect(attendances.body).toHaveLength(15)
    expect(
      attendances.body.every(
        (record: { status: string }) => record.status === 'pending',
      ),
    ).toBe(true)

    const code = await request(server)
      .get(`/sessions/${sessionId}/check-in-code`)
      .expect(200)
    expect(code.body.code).toMatch(/^\d{6}$/)

    const corrected = await request(server)
      .put(`/sessions/${sessionId}/attendances/${studentId}`)
      .send({
        status: 'late',
        reason: 'Llegó tarde',
        checkedInAt: `${today}T09:20:00+01:00`,
      })
      .expect(200)
    expect(corrected.body).toMatchObject({
      studentId,
      status: 'late',
      checkedInAt: `${today}T09:20:00+01:00`,
      updatedBy: 'teacher-ventura-rodriguez',
      reason: 'Llegó tarde',
    })

    const reopened = await request(server)
      .post(`/sessions/${sessionId}/open`)
      .expect(409)
    expect(reopened.body.code).toBe('SESSION_NOT_SCHEDULED')

    const closed = await request(server)
      .post(`/sessions/${sessionId}/close`)
      .expect(200)
    expect(closed.body.state).toBe('closed')

    const final = await request(server)
      .get(`/sessions/${sessionId}/attendances`)
      .expect(200)
    const marks = Object.fromEntries(
      final.body.map((record: { studentId: string; status: string }) => [
        record.studentId,
        record.status,
      ]),
    )
    expect(marks[studentId]).toBe('late')
    expect(marks['student-diego-molero']).toBe('absent')
  })

  it('PUT attendances requires a reason', async () => {
    const response = await request(app.getHttpServer())
      .put(`/sessions/${sessionId}/attendances/${studentId}`)
      .send({ status: 'present' })
      .expect(400)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(response.body.details).toEqual([
      { field: 'reason', message: 'El motivo es obligatorio.' },
    ])
  })

  it('PUT attendances answers 409 SESSION_NOT_EDITABLE before opening', async () => {
    const response = await request(app.getHttpServer())
      .put(`/sessions/${sessionId}/attendances/${studentId}`)
      .send({ status: 'present', reason: 'Prueba' })
      .expect(409)
    expect(response.body.code).toBe('SESSION_NOT_EDITABLE')
  })

  it('GET /courses/:courseId/students lists the enrolled students', async () => {
    const response = await request(app.getHttpServer())
      .get('/courses/course-ai-engineering/students')
      .expect(200)
    expect(response.body).toHaveLength(15)
    expect(response.body[0]).toEqual({
      studentId: 'student-diego-molero',
      name: 'Diego Molero',
      email: 'diego-molero@atempo.test',
    })
  })
})
