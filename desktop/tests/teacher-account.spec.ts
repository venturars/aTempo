import { expect, test, type Locator, type Page } from '@playwright/test'
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
// Contraseña de prueba que elige la persona invitada. No es una credencial real.
const chosenPassword = 'Clave2026!'

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
    expect(activate('000000', chosenPassword)).toBe(false)
    expect(useTeacherAccountsStore.getState().accounts).toHaveLength(1)
    expect(useSessionStore.getState().profile).toBeNull()
  })

  test('activates a teacher once, starts the session and keeps the new password', () => {
    const invitation = findInvitation(teacherInvite.code)
    expect(invitation?.email).toBe(teacherInvite.email)
    if (invitation === undefined) return
    expect(isInvitationUsed(invitation)).toBe(false)
    expect(activate(teacherInvite.code, chosenPassword)).toBe(true)
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
    useLoginStore.getState().setPassword(chosenPassword)
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

// La fila del nombre, abajo en la barra lateral del panel, que abre el menú de la cuenta.
function accountName(window: Page): Locator {
  return window.locator('aside details.dropdown > summary')
}

function logOutButton(window: Page): Locator {
  return window.getByRole('button', { name: 'Cerrar sesión', exact: true })
}

// «Cerrar sesión» del panel: no se ve hasta pulsar el nombre de la barra lateral.
async function logOutFromPanel(window: Page, name: string): Promise<void> {
  await expect(logOutButton(window)).toBeHidden()
  await expect(accountName(window)).toContainText(name)
  await accountName(window).click()
  await expect(logOutButton(window)).toBeVisible()
  await logOutButton(window).click()
}

async function expectNormalLogin(window: Page): Promise<void> {
  await expect(window.getByLabel('Correo', { exact: true })).toBeVisible()
  await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(window.getByRole('heading', { level: 1, name: /^Hola,/ })).toHaveCount(0)
}

// Fondo y anillo de la casilla, fondo de la tarjeta y el token base-100, resueltos por el navegador.
function fieldColors(field: Locator): Promise<string[]> {
  return field.evaluate((input) => {
    const token = (name: string): string => {
      const probe = document.createElement('span')
      probe.style.backgroundColor = `var(${name})`
      document.body.append(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    }
    const card = input.closest('section')
    return [
      getComputedStyle(input).backgroundColor,
      getComputedStyle(input).boxShadow,
      card === null ? '' : getComputedStyle(card).backgroundColor,
      token('--color-base-100')
    ]
  })
}

test('the invitation link opens the login to choose a password, then logs out and back in', async () => {
  const app = await launchHiddenElectron([`--invitation=${teacherInvite.code}`])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('heading', { level: 1, name: 'Hola, Lucía' })).toBeVisible()
    await expect(
      window.getByText(
        `Te han invitado a aTempo. Elige una contraseña para entrar con ${teacherInvite.email}.`,
        { exact: true }
      )
    ).toBeVisible()
    const passwordField = window.getByLabel('Contraseña', { exact: true })
    const hint = window.getByText('Al menos 8 caracteres.', { exact: true })
    await expect(hint).toBeVisible()
    await expect(passwordField).toHaveAttribute('aria-describedby', 'password-hint')
    await expect(window.getByLabel('Correo', { exact: true })).toHaveCount(0)

    // El panel explica aTempo con una semana de ejemplo, sin datos de la persona.
    await expect(window.getByText('aTempo', { exact: true })).toBeVisible()
    await expect(
      window.getByRole('heading', { level: 2, name: 'Pasar lista ya no es parte de la clase.' })
    ).toBeVisible()
    await expect(window.getByText('Los alumnos se registran con el QR.')).toBeVisible()
    await expect(window.getByRole('heading', { level: 3, name: 'Semana de ejemplo' })).toBeVisible()
    await expect(window.getByText('87 % presentes', { exact: true })).toBeVisible()
    await expect(
      window.getByRole('listitem', { name: /^(lunes|martes|miércoles|jueves|viernes)$/ })
    ).toHaveCount(5)
    await expect(
      window.getByRole('list').filter({ hasText: 'Presente' }).getByRole('listitem')
    ).toHaveText(['Presente', 'Tarde', 'Ausencia'])
    await expect(window.getByText('Trimestre de ejemplo')).toHaveCount(0)

    // El error sustituye a la pista.
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window.getByText('La contraseña es obligatoria.', { exact: true })).toBeVisible()
    await expect(hint).toHaveCount(0)
    await expect(passwordField).toHaveAttribute('aria-describedby', 'password-error')
    await passwordField.fill('corta')
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(
      window.getByText('La contraseña tiene que tener al menos 8 caracteres.', { exact: true })
    ).toBeVisible()
    await expect(hint).toHaveCount(0)
    await expect(window).not.toHaveURL(/#\/teacher\/panel$/)

    await passwordField.fill(chosenPassword)
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await expect(accountName(window)).toContainText(teacherInvite.name)

    await logOutFromPanel(window, teacherInvite.name)
    await expectNormalLogin(window)
    await expect(window.getByRole('status')).toHaveCount(0)

    await enter(window, teacherInvite.email, chosenPassword)
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await logOutFromPanel(window, teacherInvite.name)
    await expectNormalLogin(window)

    // El mismo enlace, ya usado, lleva al login normal con un aviso.
    await window.evaluate((code) => {
      location.hash = `#/?invitation=${code}`
    }, teacherInvite.code)
    await expect(window.getByRole('status')).toHaveText(usedLink)
    await expectNormalLogin(window)
    await expect(window.getByRole('heading', { name: 'Hola, Lucía' })).toHaveCount(0)
    await enter(window, teacherInvite.email, chosenPassword)
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await expect(accountName(window)).toContainText(teacherInvite.name)
  } finally {
    await app.close()
  }
})

test('the student invitation link opens the student dashboard', async () => {
  const app = await launchHiddenElectron([`--invitation=${studentInvite.code}`])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('heading', { level: 1, name: 'Hola, Bruno' })).toBeVisible()
    await expect(
      window.getByText(
        `Te han invitado a aTempo. Elige una contraseña para entrar con ${studentInvite.email}.`,
        { exact: true }
      )
    ).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveCount(0)
    await window.getByLabel('Contraseña', { exact: true }).fill('Bruno2026!')
    await window.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(window).toHaveURL(/#\/student\/dashboard$/)
    await expect(window.getByRole('heading', { level: 1, name: 'Dashboard alumno' })).toBeVisible()
    await expect(
      window.getByText(`Bienvenido ${studentInvite.name}`, { exact: true })
    ).toBeVisible()
  } finally {
    await app.close()
  }
})

test('an unknown invitation link shows the normal login with a notice', async () => {
  const app = await launchHiddenElectron(['--invitation=000000'])
  try {
    const window = await app.firstWindow()
    await expect(window.getByRole('status')).toHaveText(unknownLink)
    await expectNormalLogin(window)
    await expect(window.getByText('Al menos 8 caracteres.')).toHaveCount(0)
  } finally {
    await app.close()
  }
})

test('the account menu opens from the name and closes on a second click, outside or with Escape', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await window.setViewportSize({ width: 1280, height: 900 })
    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    const name = accountName(window)
    const menu = window.locator('aside details.dropdown')
    const logOut = logOutButton(window)
    await expect(name).toContainText('Ventura Rodriguez')
    await expect(name).toContainText('Profesor')
    const avatar = await name.locator('.avatar > div').boundingBox()
    expect(avatar).toMatchObject({ width: 32, height: 32 })
    await expect(logOut).toBeHidden()

    // Se abre hacia arriba al pulsar el nombre y se cierra al pulsarlo otra vez.
    await name.click()
    await expect(menu).toHaveAttribute('open', '')
    await expect(logOut).toBeVisible()
    const nameBox = await name.boundingBox()
    const logOutBox = await logOut.boundingBox()
    expect(nameBox).not.toBeNull()
    expect(logOutBox).not.toBeNull()
    if (nameBox && logOutBox) expect(logOutBox.y + logOutBox.height).toBeLessThanOrEqual(nameBox.y)
    await name.click()
    await expect(menu).not.toHaveAttribute('open')
    await expect(logOut).toBeHidden()

    // Pulsar fuera lo cierra sin salir.
    await name.click()
    await expect(logOut).toBeVisible()
    await window.getByRole('heading', { level: 1, name: 'Hoy' }).click()
    await expect(menu).not.toHaveAttribute('open')
    await expect(logOut).toBeHidden()
    await expect(window).toHaveURL(/#\/teacher\/panel$/)

    // Escape lo cierra y devuelve el foco al nombre.
    await name.click()
    await expect(logOut).toBeVisible()
    await logOut.focus()
    await window.keyboard.press('Escape')
    await expect(menu).not.toHaveAttribute('open')
    await expect(logOut).toBeHidden()
    await expect(name).toBeFocused()

    // Con el menú cerrado, el sitio de «Salir» no recibe clics.
    expect(logOutBox).not.toBeNull()
    if (logOutBox) {
      await window.mouse.click(
        logOutBox.x + logOutBox.width / 2,
        logOutBox.y + logOutBox.height / 2
      )
    }
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.getByLabel('Correo', { exact: true })).toHaveCount(0)

    // «Salir» cierra el menú y abre el login sin aviso.
    await logOutFromPanel(window, 'Ventura Rodriguez')
    await expect(window).toHaveURL(/#\/$/)
    await expectNormalLogin(window)
    await expect(window.getByRole('status')).toHaveCount(0)
  } finally {
    await app.close()
  }
})

test('opens Ajustes from the account menu, not from the sections', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await window.setViewportSize({ width: 1280, height: 900 })
    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    const sections = window.getByRole('navigation', { name: 'Secciones' })
    await expect(sections.getByRole('button')).toHaveText(['Dashboard', 'Sesiones', 'Estadísticas'])

    await sections.getByRole('button', { name: 'Sesiones', exact: true }).click()
    await accountName(window).click()
    const menu = window.locator('aside details.dropdown')
    await expect(menu.getByRole('listitem').first()).toHaveText('Ajustes')
    await menu.getByRole('button', { name: 'Ajustes', exact: true }).click()

    await expect(window.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible()
    await expect(menu).not.toHaveAttribute('open')
    await expect(sections.locator('[aria-current="page"]')).toHaveCount(0)
    await expect(window.getByRole('button', { name: /^Volver a/ })).toHaveCount(0)
  } finally {
    await app.close()
  }
})

test('teacher can change password, sign out and sign back in with the new password', async () => {
  const app = await launchHiddenElectron()
  try {
    const window = await app.firstWindow()
    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
    await accountName(window).click()
    await window.getByRole('button', { name: 'Cambiar contraseña' }).click()
    const dialog = window.getByRole('dialog', { name: 'Cambiar contraseña' })
    const current = dialog.getByLabel('Contraseña actual')
    const next = dialog.locator('input[name="next"]')
    const confirm = dialog.getByLabel('Repite la nueva contraseña')
    const save = dialog.getByRole('button', { name: 'Guardar contraseña' })
    await current.fill('Incorrecta123!')
    await next.fill(chosenPassword)
    await confirm.fill(chosenPassword)
    await save.click()
    await expect(dialog.getByRole('alert')).toHaveText('La contraseña actual no coincide.')
    await current.fill('Profesor123!')
    await confirm.fill('Distinta123!')
    await save.click()
    await expect(dialog.getByRole('alert')).toHaveText('Las contraseñas nuevas no coinciden.')
    await confirm.fill(chosenPassword)
    await save.click()
    await expect(dialog).toBeHidden()
    await expect(window.getByRole('status')).toHaveText('Contraseña actualizada.')
    await logOutFromPanel(window, 'Ventura Rodriguez')
    await expectNormalLogin(window)
    await enter(window, 'profesor@atempo.test', 'Profesor123!')
    await expect(window.getByText('El correo o la contraseña no coinciden.')).toBeVisible()
    await enter(window, 'profesor@atempo.test', chosenPassword)
    await expect(window).toHaveURL(/#\/teacher\/panel$/)
  } finally {
    await app.close()
  }
})

test('marks the invitation field with the system ring over the card in both themes', async () => {
  const app = await launchHiddenElectron([`--invitation=${teacherInvite.code}`])
  try {
    const window = await app.firstWindow()
    const passwordField = window.getByLabel('Contraseña', { exact: true })
    await expect(passwordField).toBeVisible()
    for (const theme of ['atempo-oscuro', 'atempo-claro']) {
      await window.evaluate(
        (value) => document.documentElement.setAttribute('data-theme', value),
        theme
      )
      await expect
        .poll(async () => {
          const [field, ring, card, base100] = await fieldColors(passwordField)
          return field === base100 && card === base100 && ring.endsWith('1px inset')
        }, theme)
        .toBe(true)
    }
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
    await window.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
    await expect(window).toHaveURL(/#\/$/)
    await expect(window.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})
