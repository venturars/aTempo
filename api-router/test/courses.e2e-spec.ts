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

    await request(app.getHttpServer())
      .get('/organizations/foo/courses')
      .expect(401)

    await request(app.getHttpServer())
      .get('/organizations/foo/courses/bar')
      .expect(401)

    await request(app.getHttpServer())
      .get('/organizations/foo/courses/bar/students')
      .expect(401)

    await request(app.getHttpServer())
      .patch('/organizations/foo/courses/bar')
      .send({ name: 'Francés A2' })
      .expect(401)

    await request(app.getHttpServer())
      .delete('/organizations/foo/courses/bar')
      .expect(401)
  })

  it('rejects patch without Bearer', async () => {
    const missing = await request(app.getHttpServer())
      .patch('/organizations/foo/courses/bar')
      .send({ name: 'Francés A2' })
      .expect(401)
    expect(missing.body.code).toBe('UNAUTHENTICATED')

    await request(app.getHttpServer())
      .patch('/organizations/foo/courses/bar')
      .set({ Authorization: 'Bearer ' })
      .send({ name: 'Francés A2' })
      .expect(401)
  })

  it('rejects delete without Bearer', async () => {
    const missing = await request(app.getHttpServer())
      .delete('/organizations/foo/courses/bar')
      .expect(401)
    expect(missing.body.code).toBe('UNAUTHENTICATED')

    await request(app.getHttpServer())
      .delete('/organizations/foo/courses/bar')
      .set({ Authorization: 'Bearer ' })
      .expect(401)
  })

  it('lists courses of an organization and reads one', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string

    const other = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send({
        ...adminBody,
        name: 'Otra',
        tax_id: 'A12345678',
        identification_document: '11111111C',
        email: 'otra@atempo.test',
      })
      .expect(201)

    const first = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const second = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send({
        ...courseBody,
        name: 'Francés A2',
        acronym: 'A2',
        contract_address: '0x0000000000000000000000000000000000000002',
      })
      .expect(201)

    const foreignCourse = await request(app.getHttpServer())
      .post(`/organizations/${other.body.organization.id}/courses`)
      .set(auth)
      .send({
        ...courseBody,
        contract_address: '0x0000000000000000000000000000000000000003',
      })
      .expect(201)

    const list = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses`)
      .set(auth)
      .expect(200)

    expect(list.body.map((course: { id: string }) => course.id).sort()).toEqual(
      [first.body.id, second.body.id].sort(),
    )

    const one = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses/${first.body.id}`)
      .set(auth)
      .expect(200)

    expect(one.body).toMatchObject({
      id: first.body.id,
      organization_id: organizationId,
      name: 'Inglés B1',
      acronym: 'B1',
      start_at: courseBody.start_at,
      end_at: courseBody.end_at,
      contract_address: courseBody.contract_address,
    })

    await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses/${foreignCourse.body.id}`)
      .set(auth)
      .expect(404)

    await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/courses/${foreignCourse.body.id}/students`,
      )
      .set(auth)
      .expect(404)
  })

  it('lists only students on students and everyone on people', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string

    const student = await request(app.getHttpServer())
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

    const teacher = await request(app.getHttpServer())
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

    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses/${course.body.id}/people`)
      .set(auth)
      .send({ person_id: student.body.id })
      .expect(201)

    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses/${course.body.id}/people`)
      .set(auth)
      .send({ person_id: teacher.body.id })
      .expect(201)

    const students = await request(app.getHttpServer())
      .get(
        `/organizations/${organizationId}/courses/${course.body.id}/students`,
      )
      .set(auth)
      .expect(200)

    const people = await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses/${course.body.id}/people`)
      .set(auth)
      .expect(200)

    expect(students.body).toHaveLength(1)
    expect(students.body[0].id).toBe(student.body.id)
    expect(
      people.body.map((person: { id: string }) => person.id).sort(),
    ).toEqual([student.body.id, teacher.body.id].sort())
  })

  it('patches a course', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const patched = await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${course.body.id}`)
      .set(auth)
      .send({
        name: 'Francés A2',
        acronym: 'A2',
        start_at: '2026-02-01T09:00:00.000Z',
        end_at: '2026-07-31T18:00:00.000Z',
        contract_address: '0x0000000000000000000000000000000000000002',
      })
      .expect(200)

    expect(patched.body).toMatchObject({
      id: course.body.id,
      organization_id: organizationId,
      name: 'Francés A2',
      acronym: 'A2',
      start_at: '2026-02-01T09:00:00.000Z',
      end_at: '2026-07-31T18:00:00.000Z',
      contract_address: '0x0000000000000000000000000000000000000002',
    })
  })

  it('returns 409 when the acronym exists', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const second = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send({
        ...courseBody,
        name: 'Francés A2',
        acronym: 'A2',
        contract_address: '0x0000000000000000000000000000000000000002',
      })
      .expect(201)

    const duplicate = await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${second.body.id}`)
      .set(auth)
      .send({ acronym: 'B1' })
      .expect(409)

    expect(duplicate.body.code).toBe('CONFLICT')
    expect(duplicate.body.message).toBe(
      'Ya existe un curso con esas siglas en la organización.',
    )
  })

  it('returns 409 when the contract address exists', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send({
        ...courseBody,
        contract_address: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
      })
      .expect(201)

    const second = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send({
        ...courseBody,
        name: 'Francés A2',
        acronym: 'A2',
        contract_address: '0x0000000000000000000000000000000000000002',
      })
      .expect(201)

    const duplicate = await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${second.body.id}`)
      .set(auth)
      .send({
        contract_address: '0x5FBDB2315678AFECB367F032D93F642F64180AA3',
      })
      .expect(409)

    expect(duplicate.body.code).toBe('CONFLICT')
    expect(duplicate.body.message).toBe(
      'La dirección del contrato ya está en uso.',
    )
  })

  it('returns 400 when the contract address is invalid', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${course.body.id}`)
      .set(auth)
      .send({ contract_address: '0x123' })
      .expect(400)
  })

  it('returns 404 for a course of another organization', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const other = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send({
        ...adminBody,
        name: 'Otra',
        tax_id: 'A12345678',
        identification_document: '11111111C',
        email: 'otra@atempo.test',
      })
      .expect(201)

    const foreignCourse = await request(app.getHttpServer())
      .post(`/organizations/${other.body.organization.id}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const patched = await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${foreignCourse.body.id}`)
      .set(auth)
      .send({ name: 'Francés A2' })
      .expect(404)

    expect(patched.body.code).toBe('NOT_FOUND')
    expect(patched.body.message).toBe('El curso no existe.')
  })

  it('returns the same course when the patch body is empty', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const patched = await request(app.getHttpServer())
      .patch(`/organizations/${organizationId}/courses/${course.body.id}`)
      .set(auth)
      .send({})
      .expect(200)

    expect(patched.body).toMatchObject({
      id: course.body.id,
      organization_id: organizationId,
      name: courseBody.name,
      acronym: courseBody.acronym,
      start_at: courseBody.start_at,
      end_at: courseBody.end_at,
      contract_address: courseBody.contract_address,
    })
  })

  it('deletes a course', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const course = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    await request(app.getHttpServer())
      .delete(`/organizations/${organizationId}/courses/${course.body.id}`)
      .set(auth)
      .expect(204)

    await request(app.getHttpServer())
      .get(`/organizations/${organizationId}/courses/${course.body.id}`)
      .set(auth)
      .expect(404)
  })

  it('returns 404 when deleting a course of another organization', async () => {
    const created = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send(adminBody)
      .expect(201)

    const organizationId = created.body.organization.id as string
    const other = await request(app.getHttpServer())
      .post('/organizations')
      .set(auth)
      .send({
        ...adminBody,
        name: 'Otra',
        tax_id: 'A12345678',
        identification_document: '11111111C',
        email: 'otra@atempo.test',
      })
      .expect(201)

    const foreignCourse = await request(app.getHttpServer())
      .post(`/organizations/${other.body.organization.id}/courses`)
      .set(auth)
      .send(courseBody)
      .expect(201)

    const deleted = await request(app.getHttpServer())
      .delete(`/organizations/${organizationId}/courses/${foreignCourse.body.id}`)
      .set(auth)
      .expect(404)

    expect(deleted.body.code).toBe('NOT_FOUND')
    expect(deleted.body.message).toBe('El curso no existe.')
  })
})
