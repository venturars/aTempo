import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, test } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'
import { isContractRequest, sendRouterRequest } from '../src/main/routerRequest'
import { createHttpTransport, type SendToRouter } from '../src/renderer/src/api/httpTransport'
import { localDay } from '../src/renderer/src/api/isoTime'
import { sampleSession, sampleStudents } from '../src/renderer/src/api/fixtures'

type Request = { method: string; url: string; authorization: string | null; body: unknown }
type Handler = (request: Request) => { status: number; body: unknown; delay?: number }

type Stub = { url: string; requests: Request[]; close: () => Promise<void> }

async function startStub(handle: Handler): Promise<Stub> {
  const requests: Request[] = []
  const server: Server = createServer((incoming: IncomingMessage, outgoing: ServerResponse) => {
    let raw = ''
    incoming.on('data', (chunk) => {
      raw += chunk
    })
    incoming.on('end', () => {
      const request = {
        method: incoming.method ?? '',
        url: incoming.url ?? '',
        authorization: incoming.headers.authorization ?? null,
        body: raw === '' ? undefined : JSON.parse(raw)
      }
      requests.push(request)
      const { status, body, delay = 0 } = handle(request)
      setTimeout(() => {
        if (outgoing.destroyed) return
        outgoing.writeHead(status, { 'Content-Type': 'application/json' })
        outgoing.end(JSON.stringify(body))
      }, delay)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      })
  }
}

function throughMain(url: string, token: string | null = null, timeout = 10_000): SendToRouter {
  return (request) => sendRouterRequest(url, token, request, timeout)
}

test('sends each operation to its contract route with the access token', async () => {
  const stub = await startStub(() => ({ status: 200, body: {} }))
  try {
    const client = createHttpTransport(throughMain(stub.url, 'token-123'))
    await client.listSessions('2026-11-23')
    await client.getSession('session 1')
    await client.listAttendances('s1')
    await client.openSession('s1')
    await client.closeSession('s1')
    await client.getCheckInCode('s1')
    await client.correctAttendance('s1', 'student-ada', { status: 'late', reason: 'Bus' })
    await client.listCourseStudents('course-ai')
    expect(stub.requests.map(({ method, url, body }) => ({ method, url, body }))).toEqual([
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
    expect(stub.requests.every((request) => request.authorization === 'Bearer token-123')).toBe(
      true
    )
  } finally {
    await stub.close()
  }
})

test('main only forwards the contract routes', () => {
  expect(isContractRequest({ method: 'GET', path: '/sessions?date=2026-11-23' })).toBe(true)
  expect(isContractRequest({ method: 'PUT', path: '/sessions/s1/attendances/a' })).toBe(true)
  expect(isContractRequest({ method: 'GET', path: '/auth/me' })).toBe(false)
  expect(isContractRequest({ method: 'DELETE', path: '/sessions/s1' })).toBe(false)
  expect(isContractRequest({ method: 'POST', path: '/sessions/s1/attendances' })).toBe(false)
  expect(isContractRequest({ method: 'GET', path: '/sessions/../auth/me' })).toBe(false)
  expect(isContractRequest({ method: 'GET', path: '/sessions/..' })).toBe(false)
  expect(isContractRequest('GET /sessions')).toBe(false)
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
      createHttpTransport(throughMain(stub.url)).correctAttendance('s1', 'student-ada', {
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
    await expect(
      createHttpTransport(throughMain(stub.url)).listSessions('2026-11-23')
    ).rejects.toMatchObject({ statusCode: 404, code: 'INTERNAL_ERROR' })
  } finally {
    await stub.close()
  }
})

test('reports a server that does not answer as NETWORK_ERROR', async () => {
  const stub = await startStub(() => ({ status: 200, body: {} }))
  await stub.close()
  await expect(
    createHttpTransport(throughMain(stub.url)).listSessions('2026-11-23')
  ).rejects.toMatchObject({ statusCode: 0, code: 'NETWORK_ERROR' })
})

test('reports a slow server as NETWORK_TIMEOUT', async () => {
  const stub = await startStub(() => ({ status: 200, body: [], delay: 500 }))
  try {
    await expect(
      createHttpTransport(throughMain(stub.url, null, 100)).listSessions('2026-11-23')
    ).rejects.toMatchObject({ statusCode: 0, code: 'NETWORK_TIMEOUT' })
  } finally {
    await stub.close()
  }
})

test('runs the Today tab through main with --api-transport=http', async () => {
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
  const originalUrl = process.env.ATEMPO_API_ROUTER_URL
  process.env.ATEMPO_API_ROUTER_URL = stub.url
  const app = await launchHiddenElectron(['--api-transport=http'])
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
    if (originalUrl === undefined) delete process.env.ATEMPO_API_ROUTER_URL
    else process.env.ATEMPO_API_ROUTER_URL = originalUrl
  }
})
