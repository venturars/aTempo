import { expect, test } from '@playwright/test'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { teacherDemoAccount } from '../src/renderer/src/login/teacherDemoAccount'
import { useRegisterStore } from '../src/renderer/src/register/registerStore'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'

type AuthBridge = {
  isConfigured: () => Promise<boolean>
  login: (credentials: { email: string; password: string }) => Promise<{
    sub: string
    email: string
  }>
  register: (credentials: { email: string; password: string }) => Promise<{
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
let registerRequest: { email: string; password: string } | null = null
let registerFailure: Error | null = null

function installAuthBridge(): void {
  const auth: AuthBridge = {
    isConfigured: async () => true,
    login: async (credentials) => {
      loginRequest = credentials
      if (loginFailure !== null) throw loginFailure
      return { sub: 'auth0|sample-user', email: credentials.email }
    },
    register: async (credentials) => {
      registerRequest = credentials
      if (registerFailure !== null) throw registerFailure
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
    registerRequest = null
    registerFailure = null
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useRegisterStore.setState(useRegisterStore.getInitialState(), true)
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

  test('sends a new student through the register bridge', async () => {
    useRegisterStore.getState().setName('Nueva Alumna')
    useRegisterStore.getState().setEmail(' NUEVA@ATEMPO.TEST ')
    useRegisterStore.getState().setPassword('SecurePass123!')
    useRegisterStore.getState().setRepeatPassword('SecurePass123!')

    await expect(useRegisterStore.getState().submitWithAuth()).resolves.toBe(true)

    expect(registerRequest).toEqual({
      email: 'nueva@atempo.test',
      password: 'SecurePass123!'
    })
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: 'nueva@atempo.test'
    })
  })

  test('maps a duplicate Auth0 email to the register form', async () => {
    registerFailure = new Error('USER_EXISTS')
    useRegisterStore.getState().setName('Nueva Alumna')
    useRegisterStore.getState().setEmail('existe@atempo.test')
    useRegisterStore.getState().setPassword('SecurePass123!')
    useRegisterStore.getState().setRepeatPassword('SecurePass123!')

    await expect(useRegisterStore.getState().submitWithAuth()).resolves.toBe(false)

    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    expect(useRegisterStore.getState().emailError).toBe('Ya hay una cuenta con este correo.')
  })

  test('preserves the demo login path when no router is configured', () => {
    useLoginStore.getState().setEmail('profesor@atempo.test')
    useLoginStore.getState().setPassword(teacherDemoAccount.password)

    expect(useLoginStore.getState().submit()).toBe(true)

    expect(loginRequest).toBeNull()
    expect(useSessionStore.getState()).toMatchObject({ profile: 'teacher' })
  })
})
