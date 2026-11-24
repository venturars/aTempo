import { expect, test } from '@playwright/test'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { teacherDemoAccount } from '../src/renderer/src/login/teacherDemoAccount'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'

type AuthBridge = {
  isConfigured: () => Promise<boolean>
  login: (credentials: { email: string; password: string }) => Promise<{
    sub: string
    email: string
  }>
  me: () => Promise<{ sub: string; email: string } | null>
  logout: () => Promise<void>
}

type TestWindow = { api: { auth: AuthBridge } }

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
let loginRequest: { email: string; password: string } | null = null
let loginFailure: Error | null = null

function installAuthBridge(): void {
  const auth: AuthBridge = {
    isConfigured: async () => true,
    login: async (credentials) => {
      loginRequest = credentials
      if (loginFailure !== null) throw loginFailure
      return { sub: 'auth0|sample-user', email: credentials.email }
    },
    me: async () => null,
    logout: async () => {}
  }
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { api: { auth } } satisfies TestWindow
  })
}

function restoreWindow(): void {
  if (originalWindowDescriptor === undefined) Reflect.deleteProperty(globalThis, 'window')
  else Object.defineProperty(globalThis, 'window', originalWindowDescriptor)
}

test.describe('Auth0 login store', () => {
  test.beforeEach(() => {
    loginRequest = null
    loginFailure = null
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useSessionStore.setState(useSessionStore.getInitialState(), true)
    installAuthBridge()
  })

  test.afterEach(restoreWindow)

  test('sends a known teacher account through the auth bridge and clears the form', async () => {
    useLoginStore.getState().setEmail(' PROFESOR@ATEMPO.TEST ')
    useLoginStore.getState().setPassword('auth0-test-password')

    await expect(useLoginStore.getState().submitWithAuth()).resolves.toBe(true)

    expect(loginRequest).toEqual({
      email: 'profesor@atempo.test',
      password: 'auth0-test-password'
    })
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'teacher',
      email: 'profesor@atempo.test'
    })
    expect(useLoginStore.getState()).toMatchObject({ email: '', password: '', isSubmitting: false })
  })

  test('waits for the previous logout before logging in again', async () => {
    let finishLogout = (): void => undefined
    const auth = (globalThis as unknown as TestWindow).api.auth
    auth.logout = () => new Promise<void>((resolve) => (finishLogout = resolve))
    useSessionStore.getState().endSession()
    useLoginStore.getState().setEmail('profesor@atempo.test')
    useLoginStore.getState().setPassword('auth0-test-password')

    const login = useLoginStore.getState().submitWithAuth()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(loginRequest).toBeNull()

    finishLogout()
    await expect(login).resolves.toBe(true)
    expect(loginRequest).not.toBeNull()
  })

  test('routes a known student account through the auth bridge', async () => {
    useLoginStore.getState().setEmail('ada.lopez@clase.test')
    useLoginStore.getState().setPassword('auth0-test-password')

    await expect(useLoginStore.getState().submitWithAuth()).resolves.toBe(true)

    expect(loginRequest?.email).toBe('ada.lopez@clase.test')
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: 'ada.lopez@clase.test'
    })
  })

  test('does not send an unknown account to the auth bridge', async () => {
    useLoginStore.getState().setEmail('unknown@example.test')
    useLoginStore.getState().setPassword('auth0-test-password')

    await expect(useLoginStore.getState().submitWithAuth()).resolves.toBe(false)

    expect(loginRequest).toBeNull()
    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    expect(useLoginStore.getState().loginError).not.toBe('')
  })

  test('keeps the session closed when the auth bridge rejects login', async () => {
    loginFailure = new Error('INVALID_CREDENTIALS')
    useLoginStore.getState().setEmail('profesor@atempo.test')
    useLoginStore.getState().setPassword('wrong-password')

    await expect(useLoginStore.getState().submitWithAuth()).resolves.toBe(false)

    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    expect(useLoginStore.getState().loginError).not.toBe('')
    expect(useLoginStore.getState().password).toBe('wrong-password')
  })

  test('preserves the demo login path when no router is configured', () => {
    useLoginStore.getState().setEmail('profesor@atempo.test')
    useLoginStore.getState().setPassword(teacherDemoAccount.password)

    expect(useLoginStore.getState().submit()).toBe(true)

    expect(loginRequest).toBeNull()
    expect(useSessionStore.getState()).toMatchObject({ profile: 'teacher' })
  })
})
