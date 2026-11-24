import { expect, test, type Locator, type Page } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'
import {
  getApiClient,
  getDemoControls,
  resetApiClient,
  withRequestRules,
  type ApiClient
} from '../src/renderer/src/api/client'
import { ApiError, type AttendanceRecord } from '../src/renderer/src/api/contract'
import { localDay } from '../src/renderer/src/api/isoTime'
import type { SendToRouter } from '../src/renderer/src/api/httpTransport'
import { sampleSession, studentIdOf, type FixtureName } from '../src/renderer/src/api/fixtures'
import { todayMark, todayPhase, usePanelStore } from '../src/renderer/src/panel/panelStore'

const diegoMolero = studentIdOf('Diego Molero')
const diegoTorres = studentIdOf('Diego Torres')

type Store = ReturnType<typeof usePanelStore.getState>

const store = (): Store => usePanelStore.getState()
async function freshToday(fixture: FixtureName = 'success'): Promise<void> {
  resetApiClient(fixture)
  usePanelStore.setState(usePanelStore.getInitialState(), true)
  await store().loadToday()
}

function sessionId(): string {
  const session = store().session
  if (session === null) throw new Error('No hay clase hoy.')
  return session.id
}

function today(time: string): string {
  return `${localDay()}T${time}:00+01:00`
}

async function arrive(studentId: string, time: string): Promise<void> {
  const demo = getDemoControls()
  if (demo === null) throw new Error('La demo necesita el mock.')
  await demo.arrive(sessionId(), studentId, time)
  await store().loadToday()
}

test.afterEach(() => {
  resetApiClient('success')
  usePanelStore.setState(usePanelStore.getInitialState(), true)
})

test('marks on-time and late arrivals', async () => {
  await freshToday()
  await store().openSession()
  await arrive(diegoMolero, '09:05')
  await arrive(diegoTorres, '09:15')
  expect(store().records[diegoMolero]?.status).toBe('present')
  expect(store().records[diegoTorres]?.status).toBe('late')
  expect(store().records[diegoMolero]?.checkedInAt).toBe(today('09:05'))
})

test('keeps a repeated arrival unchanged', async () => {
  await freshToday()
  await store().openSession()
  await arrive(diegoMolero, '09:05')
  await arrive(diegoMolero, '09:30')
  expect(store().records[diegoMolero]?.status).toBe('present')
  expect(store().records[diegoMolero]?.checkedInAt).toBe(today('09:05'))
})

test('closes the roll and marks pending as absent', async () => {
  await freshToday()
  await store().openSession()
  await arrive(diegoMolero, '09:05')
  await store().closeSession()
  expect(store().session?.state).toBe('closed')
  expect(store().records[diegoMolero]?.status).toBe('present')
  expect(store().records[diegoTorres]?.status).toBe('absent')
  expect(Object.values(store().records).some((record) => record.status === 'pending')).toBe(false)
})

test('edits the arrival time with a reason', async () => {
  await freshToday()
  await store().openSession()
  await arrive(diegoMolero, '09:05')
  store().requestTime(diegoMolero, '09:20')
  expect(store().pendingCorrection?.correction).toEqual({
    status: 'late',
    checkedInAt: today('09:20')
  })
  await store().saveCorrection('Llegó más tarde de lo que marcó')
  const record = store().records[diegoMolero]
  expect(record?.status).toBe('late')
  expect(record?.checkedInAt).toBe(today('09:20'))
  expect(record?.reason).toBe('Llegó más tarde de lo que marcó')
  expect(record?.updatedBy).toBe('teacher-ventura-rodriguez')
  expect(record?.updatedAt).not.toBeNull()
})

test('does not save a correction without a reason or that changes nothing', async () => {
  await freshToday()
  await store().openSession()
  store().requestMark(diegoMolero, 'ausente')
  await store().saveCorrection('   ')
  expect(store().records[diegoMolero]?.status).toBe('pending')
  expect(store().pendingCorrection).not.toBeNull()
  store().cancelCorrection()
  expect(store().pendingCorrection).toBeNull()
  store().requestMark(diegoMolero, 'pendiente')
  expect(store().pendingCorrection).toBeNull()
})

test('keeps the arrival of a student who checked in from becoming absent', async () => {
  await freshToday()
  await store().openSession()
  await store().simulateArrival()
  store().requestMark(diegoMolero, 'ausente')
  expect(store().pendingCorrection).toBeNull()
  store().resetToday()
  await store().loadToday()
  store().requestMark(diegoMolero, 'ausente')
  expect(store().pendingCorrection).toBeNull()
  store().requestTime(diegoTorres, '09:10')
  expect(store().pendingCorrection).toBeNull()
})

function routerWith(
  session: ReturnType<typeof sampleSession>,
  records: AttendanceRecord[],
  write: { status: number; body: unknown }
): SendToRouter {
  return async (request) => {
    if (request.path.startsWith('/sessions?')) {
      return { kind: 'response', status: 200, statusText: 'OK', body: [session] }
    }
    if (request.path === `/sessions/${session.id}`) {
      return { kind: 'response', status: 200, statusText: 'OK', body: session }
    }
    if (request.method === 'GET' && request.path === `/sessions/${session.id}/attendances`) {
      return { kind: 'response', status: 200, statusText: 'OK', body: records }
    }
    if (request.path === `/sessions/${session.id}/check-in-code`) {
      const body = { code: '123456', expiresAt: new Date(Date.now() + 30_000).toISOString() }
      return { kind: 'response', status: 200, statusText: 'OK', body }
    }
    return { kind: 'response', statusText: 'Error', ...write }
  }
}

function presentRecord(studentId: string): AttendanceRecord {
  return {
    studentId,
    name: 'Diego Molero',
    status: 'present',
    checkedInAt: today('09:05'),
    updatedBy: 'teacher-ventura-rodriguez',
    updatedAt: today('09:06'),
    reason: 'Manual'
  }
}

test('keeps the reason dialog and its error when saving fails', async () => {
  const session = { ...sampleSession(localDay()), state: 'closed' as const }
  resetApiClient(
    'success',
    routerWith(session, [presentRecord(diegoMolero)], {
      status: 503,
      body: { code: 'SERVICE_UNAVAILABLE', message: 'No disponible.' }
    })
  )
  usePanelStore.setState(usePanelStore.getInitialState(), true)
  await store().loadToday()
  store().requestMark(diegoMolero, 'retraso')
  await store().saveCorrection('Llegó tarde')
  expect(store().pendingCorrection?.studentId).toBe(diegoMolero)
  expect(store().correctionError).not.toBeNull()
  expect(store().todayError).toBeNull()
  store().cancelCorrection()
  expect(store().correctionError).toBeNull()
})

test('shows the validation details inside the reason dialog', async () => {
  const session = { ...sampleSession(localDay()), state: 'closed' as const }
  resetApiClient(
    'success',
    routerWith(session, [presentRecord(diegoMolero)], {
      status: 400,
      body: {
        code: 'VALIDATION_FAILED',
        details: [{ field: 'reason', message: 'El motivo es obligatorio.' }]
      }
    })
  )
  usePanelStore.setState(usePanelStore.getInitialState(), true)
  await store().loadToday()
  store().requestMark(diegoMolero, 'retraso')
  await store().saveCorrection('x')
  expect(store().correctionError).toBe('El motivo es obligatorio.')
})

test('keeps a cancelled session read-only', async () => {
  const session = { ...sampleSession(localDay()), state: 'cancelled' as const }
  resetApiClient('success', routerWith(session, [], { status: 500, body: {} }))
  usePanelStore.setState(usePanelStore.getInitialState(), true)
  await store().loadToday()
  expect(todayPhase(store())).toBe('cancelada')
  expect(todayMark(store(), diegoMolero)).toBe('none')
  store().requestMark(diegoMolero, 'presente')
  store().requestTime(diegoMolero, '09:10')
  expect(store().pendingCorrection).toBeNull()
})

test('asks for the sessions of the real day', async () => {
  await freshToday()
  expect(store().session?.startsAt.slice(0, 10)).toBe(localDay())
})

test('keeps one correction at a time while it is saving', async () => {
  await freshToday()
  await store().openSession()
  const client = getApiClient()
  let finish: (record: AttendanceRecord) => void = () => {}
  client.correctAttendance = () =>
    new Promise<AttendanceRecord>((resolve) => {
      finish = resolve
    })
  store().requestMark(diegoMolero, 'retraso')
  const saving = store().saveCorrection('Llegó tarde')
  expect(store().busy).toBe(true)
  store().cancelCorrection()
  store().requestMark(diegoTorres, 'ausente')
  expect(store().pendingCorrection?.studentId).toBe(diegoMolero)
  finish({ ...store().records[diegoMolero]!, status: 'late', reason: 'Llegó tarde' })
  await saving
  expect(store().pendingCorrection).toBeNull()
  expect(store().records[diegoMolero]?.status).toBe('late')
})

test('does not show a code error when closing overlaps a code renewal', async () => {
  await freshToday()
  await store().openSession()
  await Promise.all([store().refreshCheckInCode(), store().closeSession()])
  expect(store().session?.state).toBe('closed')
  expect(store().todayError).toBeNull()
  await store().reopenSession()
  await Promise.all([store().closeSession(), store().refreshCheckInCode()])
  expect(store().todayError).toBeNull()
})

test('applies the contract rules in the mock', async () => {
  const client = resetApiClient('success')
  const [session] = await client.listSessions(localDay())
  if (session === undefined) throw new Error('No hay clase hoy.')
  expect(await client.listSessions('2026-11-12')).toEqual([])
  await expect(client.listSessions('11/11/2026')).rejects.toMatchObject({
    statusCode: 400,
    code: 'VALIDATION_FAILED',
    details: [{ field: 'date' }]
  })
  await expect(client.getSession('session-nadie')).rejects.toMatchObject({
    statusCode: 404,
    code: 'SESSION_NOT_FOUND'
  })
  await expect(client.listCourseStudents('course-nadie')).rejects.toMatchObject({
    statusCode: 404,
    code: 'COURSE_NOT_FOUND'
  })
  await expect(
    client.correctAttendance(session.id, diegoMolero, { status: 'present', reason: 'Prueba' })
  ).rejects.toMatchObject({ statusCode: 409, code: 'SESSION_NOT_EDITABLE' })
  await expect(client.getCheckInCode(session.id)).rejects.toMatchObject({
    statusCode: 409,
    code: 'SESSION_NOT_OPEN'
  })
  await expect(client.closeSession(session.id)).rejects.toMatchObject({
    statusCode: 409,
    code: 'SESSION_NOT_OPEN'
  })
  await client.openSession(session.id)
  await expect(client.openSession(session.id)).rejects.toMatchObject({
    statusCode: 409,
    code: 'SESSION_NOT_SCHEDULED'
  })
  const code = await client.getCheckInCode(session.id)
  expect(code.code).toMatch(/^\d{6}$/)
  await expect(
    client.correctAttendance(session.id, diegoMolero, { status: 'present', reason: ' ' })
  ).rejects.toMatchObject({
    statusCode: 400,
    code: 'VALIDATION_FAILED',
    details: [{ field: 'reason', message: 'El motivo es obligatorio.' }]
  })
  await expect(
    client.correctAttendance(session.id, diegoMolero, {
      status: 'absent',
      reason: 'Prueba',
      checkedInAt: today('09:05')
    })
  ).rejects.toMatchObject({ statusCode: 400, details: [{ field: 'checkedInAt' }] })
  await expect(
    client.correctAttendance(session.id, 'student-nadie', { status: 'present', reason: 'Prueba' })
  ).rejects.toMatchObject({ statusCode: 404, code: 'STUDENT_NOT_ENROLLED' })
  await client.closeSession(session.id)
  const corrected = await client.correctAttendance(session.id, diegoMolero, {
    status: 'present',
    reason: 'Estaba en clase'
  })
  expect(corrected.status).toBe('present')
  expect(await getApiClient().listCourseStudents(session.courseId)).toHaveLength(15)
})

function noResponse(): ApiError {
  return new ApiError(0, 'Network Error', 'NETWORK_ERROR', 'No hay respuesta del servidor.')
}
function flakyTransport(
  failures: number,
  error: () => ApiError
): {
  transport: ApiClient
  calls: () => number
} {
  let calls = 0
  const answer = async <T>(value: T): Promise<T> => {
    calls += 1
    if (calls <= failures) {
      throw error()
    }
    return value
  }
  const record: AttendanceRecord = {
    studentId: diegoMolero,
    name: 'Diego Molero',
    status: 'present',
    checkedInAt: null,
    updatedBy: null,
    updatedAt: null,
    reason: null
  }
  const transport: ApiClient = {
    listSessions: () => answer([]),
    getSession: () => answer(sampleSession()),
    listAttendances: () => answer([]),
    openSession: () => answer(sampleSession()),
    closeSession: () => answer(sampleSession()),
    getCheckInCode: () => answer({ code: '123456', expiresAt: '2026-11-11T09:00:30Z' }),
    correctAttendance: () => answer(record),
    listCourseStudents: () => answer([])
  }
  return { transport, calls: () => calls }
}

test('retries a read once after a connection error', async () => {
  const { transport, calls } = flakyTransport(1, noResponse)
  expect(await withRequestRules(transport).listSessions('2026-11-11')).toEqual([])
  expect(calls()).toBe(2)
})

test('gives up on a read after a second connection error', async () => {
  const { transport, calls } = flakyTransport(2, noResponse)
  await expect(withRequestRules(transport).listSessions('2026-11-11')).rejects.toMatchObject({
    code: 'NETWORK_ERROR'
  })
  expect(calls()).toBe(2)
})

test('does not retry a read that the server rejected', async () => {
  const { transport, calls } = flakyTransport(
    1,
    () => new ApiError(404, 'Not Found', 'SESSION_NOT_FOUND', 'La sesión no existe.')
  )
  await expect(withRequestRules(transport).listSessions('2026-11-11')).rejects.toMatchObject({
    code: 'SESSION_NOT_FOUND'
  })
  expect(calls()).toBe(1)
})

test('never retries a write blindly', async () => {
  const { transport, calls } = flakyTransport(1, noResponse)
  await expect(withRequestRules(transport).openSession('session-1')).rejects.toMatchObject({
    code: 'NETWORK_ERROR'
  })
  expect(calls()).toBe(1)
})

test('aborts the transport request when the caller cancels', async () => {
  let seen: AbortSignal | undefined
  const transport: ApiClient = {
    ...flakyTransport(0, noResponse).transport,
    openSession: (_sessionId, options) => {
      seen = options?.signal
      return new Promise(() => {})
    }
  }
  const controller = new AbortController()
  const opening = withRequestRules(transport).openSession('session-1', {
    signal: controller.signal
  })
  controller.abort()
  await expect(opening).rejects.toMatchObject({ code: 'REQUEST_CANCELLED' })
  expect(seen?.aborted).toBe(true)
})

test('cancels a request without retrying it', async () => {
  const { transport, calls } = flakyTransport(0, noResponse)
  const controller = new AbortController()
  controller.abort()
  await expect(
    withRequestRules(transport).listSessions('2026-11-11', { signal: controller.signal })
  ).rejects.toMatchObject({ statusCode: 0, code: 'REQUEST_CANCELLED' })
  expect(calls()).toBe(0)
})

const row = (window: Page, name: string): Locator =>
  window.getByRole('row').filter({ has: window.getByRole('button', { name, exact: true }) })

async function withPanel(
  fixture: FixtureName,
  run: (window: Page) => Promise<void>,
  { clock = false } = {}
): Promise<void> {
  const app = await launchHiddenElectron([`--api-fixture=${fixture}`])
  try {
    const window = await app.firstWindow()
    if (clock) {
      await window.clock.install({ time: new Date('2026-11-11T08:00:00Z') })
      await window.reload()
    }
    await window.setViewportSize({ width: 1280, height: 900 })
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/teacher/panel'
    })
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await run(window)
  } finally {
    await app.close()
  }
}

async function giveReason(window: Page): Promise<void> {
  const dialog = window.getByRole('dialog', { name: /^Cambiar / })
  await dialog.getByLabel('Motivo', { exact: true }).fill('Corrección en clase')
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(dialog).toHaveCount(0)
}

test('opens the roll through the client', async () => {
  await withPanel('success', async (window) => {
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await expect(window.getByRole('button', { name: 'Pendiente', exact: true })).toHaveCount(15)
    await expect(window.getByRole('img', { name: 'QR de la clase', exact: true })).toBeVisible()
    await expect(window.getByText(/^\d{6}$/)).toBeVisible()
  })
})

test('corrects a mark with a reason after closing', async () => {
  await withPanel('success', async (window) => {
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await window.getByRole('button', { name: 'Cerrar lista', exact: true }).click()
    await window.getByRole('dialog').getByRole('button', { name: 'Cerrar lista' }).click()
    const diego = row(window, 'Diego Molero')
    await diego.getByRole('button', { name: 'Ausente', exact: true }).click()
    await window.getByRole('menu').getByRole('button', { name: 'Presente', exact: true }).click()
    const dialog = window.getByRole('dialog', { name: 'Cambiar a Presente' })
    await expect(dialog).toContainText('Diego Molero ·')
    await giveReason(window)
    await expect(diego.getByRole('button', { name: 'Presente', exact: true })).toBeVisible()
  })
})

test('keeps the row when the reason dialog is cancelled', async () => {
  await withPanel('success', async (window) => {
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    const diego = row(window, 'Diego Molero')
    await diego.getByRole('button', { name: 'Pendiente', exact: true }).click()
    await window.getByRole('menu').getByRole('button', { name: 'Tarde', exact: true }).click()
    const dialog = window.getByRole('dialog', { name: 'Cambiar a Tarde' })
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(dialog.getByText('Escribe el motivo del cambio.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(diego.getByRole('button', { name: 'Pendiente', exact: true })).toBeVisible()
  })
})

test('shows the empty state without sessions', async () => {
  await withPanel('empty', async (window) => {
    await expect(window.getByText('No tienes clases hoy.', { exact: true })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Abrir lista', exact: true })).toHaveCount(0)
  })
})

test('shows access denied', async () => {
  await withPanel('denied', async (window) => {
    await expect(window.getByRole('alert')).toHaveText('No tienes acceso a esta clase.')
    await expect(window.getByRole('button', { name: 'Abrir lista', exact: true })).toHaveCount(0)
  })
})

test('recovers from a network failure', async () => {
  await withPanel('network', async (window) => {
    const open = window.getByRole('button', { name: 'Abrir lista', exact: true })
    await open.click()
    await expect(window.getByRole('alert')).toHaveText(
      'No se ha podido conectar con el servidor. Inténtalo de nuevo.'
    )
    await expect(open).toBeEnabled()
    await expect(window.getByRole('img', { name: 'QR de la clase', exact: true })).toHaveCount(0)
  })
})

test('rereads the session after a conflict', async () => {
  await withPanel('conflict', async (window) => {
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await expect(window.getByRole('alert')).toHaveText(
      'La lista ya se abrió desde otro sitio. Ya ves cómo está ahora.'
    )
    await expect(window.getByRole('button', { name: 'Cerrar lista', exact: true })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Pendiente', exact: true })).toHaveCount(15)
  })
})

test('renews an expired check-in code', async () => {
  await withPanel('expired-code', async (window) => {
    await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await expect(window.getByText(/^\d{6}$/)).toBeVisible()
    await expect(window.getByText(/^Cambia en \d+ segundos?$/)).toBeVisible()
  })
})

test('goes back to the login when the session has expired', async () => {
  const app = await launchHiddenElectron(['--api-fixture=unauthenticated'])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/teacher/panel'
    })
    await expect.poll(() => window.evaluate(() => globalThis.location.hash)).toBe('#/')
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toHaveCount(0)
  } finally {
    await app.close()
  }
})

test('shows a generic message when the server fails', async () => {
  await withPanel('server-error', async (window) => {
    const open = window.getByRole('button', { name: 'Abrir lista', exact: true })
    await open.click()
    await expect(window.getByRole('alert')).toHaveText(
      'No se ha podido completar. Inténtalo de nuevo.'
    )
    await expect(open).toBeEnabled()
  })
})

test('stops waiting after ten seconds without an answer', async () => {
  await withPanel(
    'timeout',
    async (window) => {
      const open = window.getByRole('button', { name: 'Abrir lista', exact: true })
      await open.click()
      await expect(open).toBeDisabled()
      await window.clock.fastForward(10_000)
      await expect(window.getByRole('alert')).toHaveText(
        'El servidor tarda demasiado en responder. Inténtalo de nuevo.'
      )
      await expect(open).toBeEnabled()
    },
    { clock: true }
  )
})

test('keeps asking for the check-in code after it fails', async () => {
  await withPanel(
    'code-unavailable',
    async (window) => {
      await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
      const waiting = window.getByText('Pidiendo el código…', { exact: true })
      await expect(waiting).toBeVisible()
      await window.clock.fastForward(1_000)
      await expect(waiting).toBeVisible()
      await window.clock.fastForward(5_000)
      await expect(window.getByText(/^\d{6}$/)).toBeVisible()
    },
    { clock: true }
  )
})
