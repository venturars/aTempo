import { expect, test, type Page } from '@playwright/test'
import { isInvitationUsed, useActivateStore } from '../src/renderer/src/login/activateStore'
import { findInvitation } from '../src/renderer/src/login/invitations'
import { useLoginStore } from '../src/renderer/src/login/loginStore'
import { useTeacherAccountsStore } from '../src/renderer/src/login/teacherAccounts'
import { useSessionStore } from '../src/renderer/src/session/sessionStore'
import { useStudentAccountsStore } from '../src/renderer/src/student/studentAccounts'
import { launchHiddenElectron } from './helpers/electron'

// Invitaciones públicas de la demo, escritas aquí a propósito y no importadas.
const teacherInvite = { email: 'lucia.martin@atempo.test', code: '731905', name: 'Lucía Martín' }
const studentInvite = { email: 'bruno.sanz@clase.test', code: '264018', name: 'Bruno Sanz' }
const unknownLink = 'Este enlace de invitación no es válido.'
const usedLink = 'Esta invitación ya está activada. Entra con tu contraseña.'

function activate(code: string, password: string): boolean {
  useActivateStore.getState().setPassword(password)
  return useActivateStore.getState().submit(code)
}

test.describe('invitation logic', () => {
  test.beforeEach(() => {
    useActivateStore.setState(useActivateStore.getInitialState(), true)
    useLoginStore.setState(useLoginStore.getInitialState(), true)
    useSessionStore.setState(useSessionStore.getInitialState(), true)
    useTeacherAccountsStore.setState(useTeacherAccountsStore.getInitialState(), true)
    useStudentAccountsStore.setState(useStudentAccountsStore.getInitialState(), true)
  })

  test('asks for a new password of 8 characters or more', () => {
    expect(activate(teacherInvite.code, '')).toBe(false)
    expect(useActivateStore.getState().passwordError).toBe('La contraseña es obligatoria.')
    expect(activate(teacherInvite.code, 'corta')).toBe(false)
    expect(useActivateStore.getState().passwordError).toBe(
      'La contraseña tiene que tener al menos 8 caracteres.'
    )
    expect(useSessionStore.getState().profile).toBeNull()
  })

  test('does nothing with an unknown code', () => {
    expect(findInvitation('000000')).toBeUndefined()
    expect(activate('000000', 'Clave2026!')).toBe(false)
    expect(useTeacherAccountsStore.getState().accounts).toHaveLength(1)
    expect(useSessionStore.getState().profile).toBeNull()
  })

  test('activates a teacher once, starts the session and keeps the new password', () => {
    const invitation = findInvitation(teacherInvite.code)
    expect(invitation?.email).toBe(teacherInvite.email)
    if (invitation === undefined) return
    expect(isInvitationUsed(invitation)).toBe(false)
    expect(activate(teacherInvite.code, 'Clave2026!')).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'teacher',
      email: teacherInvite.email,
      name: teacherInvite.name
    })
    expect(useActivateStore.getState().password).toBe('')
    expect(isInvitationUsed(invitation)).toBe(true)

    useSessionStore.getState().endSession()
    expect(activate(teacherInvite.code, 'Otra2026!')).toBe(false)
    expect(useSessionStore.getState().profile).toBeNull()

    useLoginStore.getState().setEmail(teacherInvite.email)
    useLoginStore.getState().setPassword('Clave2026!')
    expect(useLoginStore.getState().submit()).toBe(true)
    expect(useSessionStore.getState()).toMatchObject({
      profile: 'teacher',
      name: teacherInvite.name
    })
  })

  test('activates an invited student as a student account', () => {
    expect(activate(studentInvite.code, 'Bruno2026!')).toBe(true)
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

test('the invitation link opens the login to choose a password, then logs out and back in', async () => {
  const app = await launchHiddenElectron([`--invitation=${teacherInvite.code}`])
  try {
    const window = await app.firstWindow()
    await expect(window.getByText(teacherInvite.name, { exact: true })).toBeVisible()
    await expect(window.getByText(teacherInvite.email, { exact: true })).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveCount(0)
    await expect(window.getByText('Entra con tu correo.')).toHaveCount(0)

    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window.getByText('La contraseña es obligatoria.')).toBeVisible()
    await window.getByLabel('Contraseña nueva', { exact: true }).fill('Clave2026!')
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await expect(window.getByText(teacherInvite.name, { exact: true })).toBeVisible()

    await window.getByRole('button', { name: 'Salir', exact: true }).click()
    await expect(window.getByText('Entra con tu correo.')).toBeVisible()
    await expect(window.getByRole('status')).toHaveCount(0)

    await enter(window, teacherInvite.email, 'Clave2026!')
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await window.getByRole('button', { name: 'Salir', exact: true }).click()

    // El mismo enlace, ya usado, lleva al login normal con un aviso.
    await window.evaluate((code) => {
      location.hash = `#/?invitation=${code}`
    }, teacherInvite.code)
    await expect(window.getByRole('status')).toHaveText(usedLink)
    await expect(window.getByLabel('Contraseña nueva', { exact: true })).toHaveCount(0)
    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    await expect(window.getByText('Ventura Rodriguez', { exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})

test('an unknown invitation link shows the normal login with a notice', async () => {
  const app = await launchHiddenElectron(['--invitation=000000'])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('status')).toHaveText(unknownLink)
    await expect(window.getByText('Entra con tu correo.')).toBeVisible()
    await expect(window.getByLabel('Contraseña nueva', { exact: true })).toHaveCount(0)
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
