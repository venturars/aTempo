import { expect, test, type Page } from '@playwright/test'
import { useActivateStore } from '../src/renderer/src/login/activateStore'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { useTeacherAccountsStore } from '../src/renderer/src/login/teacherAccounts'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'
import { useStudentAccountsStore } from '../src/renderer/src/student/studentAccounts'
import { launchHiddenElectron } from './helpers/electron'

// Invitaciones públicas de la demo, escritas aquí a propósito y no importadas.
const teacherInvite = { email: 'lucia.martin@atempo.test', code: '731905', name: 'Lucía Martín' }
const studentInvite = { email: 'bruno.sanz@clase.test', code: '264018', name: 'Bruno Sanz' }
const noInvitation = 'El correo o el código no coinciden con ninguna invitación.'
const usedInvitation = 'Esta invitación ya está activada. Entra con tu contraseña.'

function activate(email: string, code: string, password: string): boolean {
  useActivateStore.getState().setEmail(email)
  useActivateStore.getState().setCode(code)
  useActivateStore.getState().setPassword(password)
  return useActivateStore.getState().submit()
}

test.describe('invitation logic', () => {
  test.beforeEach(() => {
    useActivateStore.setState(useActivateStore.getInitialState(), true)
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useSessionStore.setState(useSessionStore.getInitialState(), true)
    useTeacherAccountsStore.setState(useTeacherAccountsStore.getInitialState(), true)
    useStudentAccountsStore.setState(useStudentAccountsStore.getInitialState(), true)
  })

  test('checks every field before looking for the invitation', () => {
    expect(activate('', '', '')).toBe(false)
    expect(useActivateStore.getState()).toMatchObject({
      emailError: 'El correo es obligatorio.',
      codeError: 'El código es obligatorio.',
      passwordError: 'La contraseña es obligatoria.',
      activateError: ''
    })
    expect(activate('lucia', '1', 'corta')).toBe(false)
    expect(useActivateStore.getState()).toMatchObject({
      emailError: 'El correo no tiene una forma válida.',
      passwordError: 'La contraseña tiene que tener al menos 8 caracteres.'
    })
    expect(useSessionStore.getState().profile).toBeNull()
  })

  test('gives the same answer for an unknown email or a wrong code', () => {
    expect(activate('nadie@atempo.test', teacherInvite.code, 'Clave2026!')).toBe(false)
    expect(useActivateStore.getState().activateError).toBe(noInvitation)
    expect(activate(teacherInvite.email, '000000', 'Clave2026!')).toBe(false)
    expect(useActivateStore.getState().activateError).toBe(noInvitation)
    expect(useTeacherAccountsStore.getState().accounts).toHaveLength(1)
  })

  test('activates a teacher once, starts the session and keeps the new password', () => {
    expect(
      activate(`  ${teacherInvite.email.toUpperCase()} `, teacherInvite.code, 'Clave2026!')
    ).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'teacher',
      email: teacherInvite.email,
      name: teacherInvite.name
    })
    expect(useActivateStore.getState()).toMatchObject({ email: '', code: '', password: '' })

    useSessionStore.getState().endSession()
    expect(activate(teacherInvite.email, teacherInvite.code, 'Otra2026!')).toBe(false)
    expect(useActivateStore.getState().activateError).toBe(usedInvitation)

    useLoginStore.getState().setEmail(teacherInvite.email)
    useLoginStore.getState().setPassword('Clave2026!')
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'teacher',
      name: teacherInvite.name
    })
  })

  test('activates an invited student as a student account', () => {
    expect(activate(studentInvite.email, studentInvite.code, 'Bruno2026!')).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'student',
      email: studentInvite.email
    })
    expect(useStudentAccountsStore.getState().findByEmail(studentInvite.email)?.name).toBe(
      studentInvite.name
    )
  })

  test('logging out clears the profile, email and name', () => {
    useSessionStore.getState().startTeacherSession('profesor@atempo.test', 'Ventura Rodriguez')
    useSessionStore.getState().endSession()
    expect(useSessionStore.getState()).toMatchObject({ profile: null, email: null, name: null })
  })
})

async function enter(window: Page, email: string, password: string): Promise<void> {
  await window.getByLabel('Correo', { exact: true }).fill(email)
  await window.getByLabel('Contraseña', { exact: true }).fill(password)
  await window.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test('activates an invitation from the login, logs out and logs back in', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await window.getByRole('button', { name: 'Tengo una invitación', exact: true }).click()
    await expect(window).toHaveURL(/#\/activate$/)
    await window.getByRole('button', { name: 'Volver', exact: true }).click()
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()

    await window.getByRole('button', { name: 'Tengo una invitación', exact: true }).click()
    await window.getByRole('button', { name: 'Activar cuenta', exact: true }).click()
    await expect(window.getByText('El código es obligatorio.')).toBeVisible()
    await window.getByLabel('Correo', { exact: true }).fill(teacherInvite.email)
    await window.getByLabel('Código de invitación', { exact: true }).fill('111111')
    await window.getByLabel('Contraseña nueva', { exact: true }).fill('Clave2026!')
    await window.getByRole('button', { name: 'Activar cuenta', exact: true }).click()
    await expect(window.getByRole('alert')).toHaveText(noInvitation)

    await window.getByLabel('Código de invitación', { exact: true }).fill(teacherInvite.code)
    await window.getByRole('button', { name: 'Activar cuenta', exact: true }).click()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await expect(window.getByText(teacherInvite.name, { exact: true })).toBeVisible()

    await window.getByRole('button', { name: 'Salir', exact: true }).click()
    await expect(window).toHaveURL(/#\/$/)
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()

    await enter(window, teacherInvite.email, 'Clave2026!')
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.getByText(teacherInvite.name, { exact: true })).toBeVisible()
    await window.getByRole('button', { name: 'Salir', exact: true }).click()

    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    await expect(window.getByText('Ventura Rodriguez', { exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})

test('a student logs out from the desktop home', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, 'ada.lopez@clase.test', 'clase-2026')
    await expect(window).toHaveURL(/#\/student\/dashboard$/)
    await window.getByRole('button', { name: 'Salir', exact: true }).click()
    await expect(window).toHaveURL(/#\/$/)
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})
