import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'
import { createHttpTransport } from '../src/renderer/src/api/httpTransport'
import { localDay } from '../src/renderer/src/api/isoTime'
import { sampleSession, sampleStudents } from '../src/renderer/src/api/fixtures'

type Request = { method: string; url: string; body: unknown }
type Handler = (request: Request) => { status: number; body: unknown }

type Stub = { url: string; requests: Request[]; close: () => Promise<void> }

async function startStub(handle: Handler): Promise<Stub> {
  const requests: Request[] = []
  const server: Server = createServer((incoming: IncomingMessage, outgoing: ServerResponse) => {
    let raw = ''
    incoming.on('data', (chunk) => {
      raw += chunk
    })
    incoming.on('end', () => {
      if (incoming.method === 'OPTIONS') {
        outgoing.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT',
          'Access-Control-Allow-Headers': 'Content-Type, Accept'
        })
        outgoing.end()
        return
      }
      const request = {
        method: incoming.method ?? '',
        url: incoming.url ?? '',
        body: raw === '' ? undefined : JSON.parse(raw)
      }
      requests.push(request)
      const { status, body } = handle(request)
      outgoing.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
      outgoing.end(JSON.stringify(body))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  }
}

test('sends each operation to its contract route', async () => {
  const stub = await startStub(() => ({ status: 200, body: {} }))
  try {
    const client = createHttpTransport(`${stub.url}/`)
    await client.listSessions('2026-11-23')
    await client.getSession('session 1')
    await client.listAttendances('s1')
    await client.openSession('s1')
    await client.closeSession('s1')
    await client.getCheckInCode('s1')
    await client.correctAttendance('s1', 'student-ada', { status: 'late', reason: 'Bus' })
    await client.listCourseStudents('course-ai')
    expect(stub.requests).toEqual([
      { method: 'GET', url: '/sessions?date=2026-11-23', body: undefined },
      { method: 'GET', url: '/sessions/session%201', body: undefined },
      { method: 'GET', url: '/sessions/s1/attendances', body: undefined },
      { method: 'POST', url: '/sessions/s1/open', body: undefined },
      { method: 'POST', url: '/sessions/s1/close', body: undefined },
      { method: 'GET', url: '/sessions/s1/check-in-code', body: undefined },
      {
        method: 'PUT',
        url: '/sessions/s1/attendances/student-ada',
        body: { status: 'late', reason: 'Bus' }
      },
      { method: 'GET', url: '/courses/course-ai/students', body: undefined }
    ])
  } finally {
    await stub.close()
  }
})

test('turns a contract error body into an ApiError', async () => {
  const stub = await startStub(() => ({
    status: 400,
    body: {
      statusCode: 400,
      error: 'Bad Request',
      code: 'VALIDATION_FAILED',
      message: 'La petición no es válida.',
      details: [{ field: 'reason', message: 'El motivo es obligatorio.' }]
    }
  }))
  try {
    await expect(
      createHttpTransport(stub.url).correctAttendance('s1', 'student-ada', {
        status: 'present',
        reason: ''
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      details: [{ field: 'reason', message: 'El motivo es obligatorio.' }]
    })
  } finally {
    await stub.close()
  }
})

test('falls back to a code by status when the body has none', async () => {
  const stub = await startStub(() => ({
    status: 404,
    body: { statusCode: 404, message: 'Cannot GET /sessions', error: 'Not Found' }
  }))
  try {
    await expect(createHttpTransport(stub.url).listSessions('2026-11-23')).rejects.toMatchObject({
      statusCode: 404,
      code: 'INTERNAL_ERROR'
    })
  } finally {
    await stub.close()
  }
})

test('reports a server that does not answer as NETWORK_ERROR', async () => {
  const stub = await startStub(() => ({ status: 200, body: {} }))
  await stub.close()
  await expect(createHttpTransport(stub.url).listSessions('2026-11-23')).rejects.toMatchObject({
    statusCode: 0,
    code: 'NETWORK_ERROR'
  })
})

test('runs the Today tab against an HTTP server with --api-url', async () => {
  const session = sampleSession(localDay())
  const students = sampleStudents()
  const pending = students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    status: 'pending',
    checkedInAt: null,
    updatedBy: null,
    updatedAt: null,
    reason: null
  }))
  const stub = await startStub((request) => {
    const path = request.url.split('?')[0]
    if (path === '/sessions') return { status: 200, body: [session] }
    if (path === `/sessions/${session.id}`) return { status: 200, body: session }
    if (path === `/sessions/${session.id}/attendances`) return { status: 200, body: pending }
    if (path === `/courses/${session.courseId}/students`) return { status: 200, body: students }
    return {
      status: 503,
      body: {
        statusCode: 503,
        error: 'Service Unavailable',
        code: 'SERVICE_UNAVAILABLE',
        message: 'El servicio no está disponible.'
      }
    }
  })
  const app = await launchHiddenElectron([`--api-url=${stub.url}`])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/teacher/panel'
    })
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Diego Molero', exact: true })).toBeVisible()
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await expect(window.getByRole('alert')).toBeVisible()
    expect(stub.requests.map((request) => `${request.method} ${request.url}`)).toContain(
      `POST /sessions/${session.id}/open`
    )
  } finally {
    await app.close()
    await stub.close()
  }
})
