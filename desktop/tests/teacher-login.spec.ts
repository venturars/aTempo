import { expect, test, type Page } from '@playwright/test'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { useRegisterStore } from '../src/renderer/src/register/registerStore'
import { useStudentAccountsStore } from '../src/renderer/src/student/studentAccounts'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'
import { launchHiddenElectron } from './helpers/electron'

// Public fixture specified in #48, deliberately independent of the implementation constant.
const demoEmail = 'profesor@atempo.test'
const demoPassword = 'Profesor123!'
const loginError = 'El correo o la contraseña no coinciden con la cuenta de ejemplo.'

async function enter(window: Page, email: string, password: string): Promise<void> {
  await window.getByLabel('Correo', { exact: true }).fill(email)
  await window.getByLabel('Contraseña', { exact: true }).fill(password)
  await window.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function expectHoy(window: Page): Promise<void> {
  await expect(window).toHaveURL(/#\/teacher\/panel$/)
  await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
  await expect(window.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toHaveCount(0)
  await expect(window.getByRole('alert')).toHaveCount(0)
}

test.describe('teacher demo session logic', () => {
  test.beforeEach(() => {
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useSessionStore.setState(useSessionStore.getInitialState(), true)
    useRegisterStore.setState(useRegisterStore.getInitialState(), true)
    useStudentAccountsStore.setState(useStudentAccountsStore.getInitialState(), true)
  })

  test('starts with no profile or email', () => {
    expect(useSessionStore.getInitialState()).toMatchObject({ profile: null, email: null })
  })

  test('normalizes the public email and sets the teacher identity', () => {
    useLoginStore.getState().setEmail('  PROFESOR@ATEMPO.TEST  ')
    useLoginStore.getState().setPassword(demoPassword)
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({ profile: 'teacher', email: demoEmail })
    expect(useLoginStore.getState().loginError).toBe('')
  })

  for (const [name, email, password] of [
    ['wrong password', demoEmail, 'profesor123!'],
    ['unknown email', 'otra@atempo.test', demoPassword]
  ]) {
    test(`rejects ${name} without creating an identity and accepts a later correct submit`, () => {
      useLoginStore.getState().setEmail(email)
      useLoginStore.getState().setPassword(password)
      expect(useLoginStore.getState().submit()).toBe(false)
      expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
      expect(useLoginStore.getState().loginError).toBe(loginError)
      useLoginStore.getState().setEmail(demoEmail)
      useLoginStore.getState().setPassword(demoPassword)
      expect(useLoginStore.getState().submit()).toBe(true)
      expect(useSessionStore.getState()).toMatchObject({ profile: 'teacher', email: demoEmail })
    })
  }

  for (const password of ['profesor123!', ' Profesor123!', 'Profesor123! ']) {
    test(`requires the exact teacher password ${JSON.stringify(password)}`, () => {
      useLoginStore.getState().setEmail(demoEmail)
      useLoginStore.getState().setPassword(password)
      expect(useLoginStore.getState().submit()).toBe(false)
      expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    })
  }

  test('keeps student identity and history with normalized sample email', () => {
    useLoginStore.getState().setEmail(' ADA.LOPEZ@CLASE.TEST ')
    useLoginStore.getState().setPassword('clase-2026')
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: 'ada.lopez@clase.test'
    })
    expect(
      useStudentAccountsStore.getState().findByEmail('ada.lopez@clase.test')?.history
    ).toHaveLength(6)
  })

  test('rejects the wrong student password without creating a profile', () => {
    useLoginStore.getState().setEmail('ada.lopez@clase.test')
    useLoginStore.getState().setPassword(demoPassword)
    expect(useLoginStore.getState().submit()).toBe(false)
    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    // Mismo aviso que un correo desconocido: no revela que la cuenta existe.
    expect(useLoginStore.getState().passwordError).toBe('')
    expect(useLoginStore.getState().loginError).toBe(loginError)
  })

  for (const [name, email, password] of [
    ['teacher', demoEmail, demoPassword],
    ['student', 'ada.lopez@clase.test', 'clase-2026']
  ]) {
    test(`clears the form after a successful ${name} login`, () => {
      useLoginStore.getState().setEmail(email)
      useLoginStore.getState().setPassword(password)
      expect(useLoginStore.getState().submit()).toBe(true)
      expect(useLoginStore.getState().email).toBe('')
      expect(useLoginStore.getState().password).toBe('')
    })
  }

  test('clears the sign-up form after creating the account', () => {
    const register = useRegisterStore.getState()
    register.setName('Otra alumna')
    register.setEmail('otra@clase.test')
    register.setPassword('secreta12')
    register.setRepeatPassword('secreta12')
    expect(register.submit()).toBe(true)
    expect(useRegisterStore.getState()).toMatchObject({
      name: '',
      email: '',
      password: '',
      repeatPassword: ''
    })
  })

  test('registers a separate student and preserves its identity on subsequent login', () => {
    const register = useRegisterStore.getState()
    register.setName(' Nueva alumna ')
    register.setEmail('nueva@clase.test')
    register.setPassword('secreta12')
    register.setRepeatPassword('secreta12')
    expect(register.submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: 'nueva@clase.test'
    })
    expect(useStudentAccountsStore.getState().findByEmail('nueva@clase.test')?.history).toEqual([])
    useSessionStore.setState({ profile: null, email: null })
    useLoginStore.getState().setEmail(' NUEVA@CLASE.TEST ')
    useLoginStore.getState().setPassword('secreta12')
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: 'nueva@clase.test'
    })
  })

  test('reserves normalized teacher email without adding or overwriting a student', () => {
    const before = useStudentAccountsStore.getState().accounts
    const register = useRegisterStore.getState()
    register.setName('Otro profesor')
    register.setEmail(' PROFESOR@ATEMPO.TEST ')
    register.setPassword('secreta12')
    register.setRepeatPassword('secreta12')
    expect(register.submit()).toBe(false)
    expect(useRegisterStore.getState().emailError).toBe('Ya hay una cuenta con este correo.')
    expect(useStudentAccountsStore.getState().accounts).toEqual(before)
    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null })
    useLoginStore.getState().setEmail(demoEmail)
    useLoginStore.getState().setPassword(demoPassword)
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({ profile: 'teacher', email: demoEmail })
  })
})

test('recovers from a wrong password with one correct submit in the same window', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    expect(new URL(window.url()).hash).toBe('')
    await enter(window, demoEmail, 'WrongPassword48!')
    await expect(window.getByRole('alert')).toHaveText(loginError)
    await expect(window.getByRole('status')).toHaveCount(0)
    expect(new URL(window.url()).hash).toBe('')
    const text = await window.locator('body').innerText()
    expect(text).not.toContain('WrongPassword48!')
    expect(text).not.toContain(demoEmail)
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toHaveCount(0)
    await window.getByLabel('Contraseña', { exact: true }).fill(demoPassword)
    await expect(window.getByRole('alert')).toHaveCount(0)
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('can log in again after renderer reload without persisting a session', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
    await window.reload()
    // The router preserves its hash; the in-memory session does not promise a route guard.
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/'
    })
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('keeps the login empty when returning to it without a reload', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
    await window.evaluate(() => {
      globalThis.location.hash = '#/'
    })
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  } finally {
    await app.close()
  }
})

test('does not show or record student data with a teacher session', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
    for (const hash of ['#/student/dashboard', '#/student/scan', '#/student/history']) {
      await window.evaluate((next) => {
        globalThis.location.hash = next
      }, hash)
      await expect(
        window.getByRole('heading', { level: 1, name: 'No hay una sesión de alumno' })
      ).toBeVisible()
      await expect(window.getByText('Bienvenido')).toHaveCount(0)
      await expect(window.getByRole('button', { name: 'Escanear' })).toHaveCount(0)
    }
  } finally {
    await app.close()
  }
})

test('empties the login and sign-up forms after leaving them without a successful submit', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, demoEmail, 'clave-incorrecta')
    await expect(window.getByText(loginError)).toBeVisible()
    await window.evaluate(() => {
      globalThis.location.hash = '#/sign-up'
    })
    await window.getByLabel('Nombre completo').fill('Otra alumna')
    await window.getByLabel('Correo electrónico').fill('otra@clase.test')
    await window.getByLabel('Contraseña', { exact: true }).fill('secreta12')
    await window.getByLabel('Repetir contraseña').fill('secreta12')
    await window.getByRole('button', { name: 'Inicia sesión' }).click()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
    await expect(window.getByText(loginError)).toHaveCount(0)
    await window.evaluate(() => {
      globalThis.location.hash = '#/sign-up'
    })
    await expect(window.getByLabel('Correo electrónico')).toHaveValue('')
    await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
    await expect(window.getByLabel('Repetir contraseña')).toHaveValue('')
  } finally {
    await app.close()
  }
})

test('opens Hoy from a second fresh normal process after closing the first', async () => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const app = await launchHiddenElectron()
    try {
      const window = await app.firstWindow()
      expect(new URL(window.url()).hash).toBe('')
      await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
      await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
      await expect(window.getByRole('alert')).toHaveCount(0)
      await enter(window, demoEmail, demoPassword)
      await expectHoy(window)
      await window.screenshot({ path: test.info().outputPath(`teacher-demo-start-${attempt}.png`) })
    } finally {
      await app.close()
    }
  }
})

test('normalizes teacher email through the normal form', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, '  PROFESOR@ATEMPO.TEST  ', demoPassword)
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('rejects reserved signup then accepts teacher login in the same window', async () => {
  const app = await launchHiddenElectron(['--sign-up'])
  try {
    const window = await app.firstWindow()
    await window.getByLabel('Nombre completo').fill('Profesor reservado')
    await window.getByLabel('Correo electrónico').fill(' PROFESOR@ATEMPO.TEST ')
    await window.getByLabel('Contraseña', { exact: true }).fill('otra-clave12')
    await window.getByLabel('Repetir contraseña').fill('otra-clave12')
    await window.getByRole('button', { name: 'Crear mi cuenta' }).click()
    await expect(window.getByText('Ya hay una cuenta con este correo.')).toBeVisible()
    await expect(window).toHaveURL(/#\/sign-up$/)
    await expect(window.getByRole('heading', { name: 'Dashboard alumno' })).toHaveCount(0)
    await window.getByRole('button', { name: 'Inicia sesión' }).click()
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('recovers from unknown email without showing either credential', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, 'desconocido@clase.test', 'desconocida12')
    await expect(window.getByRole('alert')).toHaveText(loginError)
    expect(new URL(window.url()).hash).toBe('')
    const text = await window.locator('body').innerText()
    expect(text).not.toContain('desconocido@clase.test')
    expect(text).not.toContain('desconocida12')
    await expect(window.getByRole('status')).toHaveCount(0)
    await enter(window, demoEmail, demoPassword)
    await expectHoy(window)
  } finally {
    await app.close()
  }
})

test('repeats student login after reload and in fresh normal processes', async () => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const app = await launchHiddenElectron()
    try {
      const window = await app.firstWindow()
      expect(new URL(window.url()).hash).toBe('')
      await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
      await enter(window, ' ADA.LOPEZ@CLASE.TEST ', 'clase-2026')
      await expect(window).toHaveURL(/#\/student\/dashboard$/)
      await expect(window.getByText('Bienvenido Ada López')).toBeVisible()
      await expect(window.getByRole('heading', { name: 'Hoy', exact: true })).toHaveCount(0)
      await window.reload()
      await window.evaluate(() => {
        globalThis.location.hash = '#/'
      })
      await expect(window.getByLabel('Correo', { exact: true })).toHaveValue('')
      await expect(window.getByLabel('Contraseña', { exact: true })).toHaveValue('')
      await enter(window, 'ada.lopez@clase.test', 'clase-2026')
      await expect(window.getByText('Bienvenido Ada López')).toBeVisible()
    } finally {
      await app.close()
    }
  }
})
