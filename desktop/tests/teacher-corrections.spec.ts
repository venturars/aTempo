import { expect, test, type Locator, type Page } from '@playwright/test'
import { usePanelStore } from '../src/renderer/src/panel/panelStore'
import { useSettingsStore } from '../src/renderer/src/panel/settingsStore'
import { launchHiddenElectron } from './helpers/electron'

const teacher = 'Ventura Rodriguez'
// Contraseña de prueba que elige la persona invitada. No es una credencial real.
const chosenPassword = 'Clave2026!'
// Invitación pública de la demo, escrita aquí a propósito y no importada.
const invitedTeacher = { code: '731905', name: 'Lucía Martín' }
// El reloj de la ventana se para aquí: da la fecha y la hora de cada cambio.
const changedAt = new Date('2026-11-11T09:40:00Z')

test.describe('correction logic', () => {
  test.beforeEach(() => {
    usePanelStore.setState(usePanelStore.getInitialState(), true)
    useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  })

  test('corrects a past session and keeps every change in order', () => {
    const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
    expect(state().correctSessionMark('Mar 10 nov', 'Diego Torres', 'ausente', 'x', teacher)).toBe(
      false
    )
    expect(state().correctSessionMark('Jue 12 nov', 'Diego Torres', 'presente', 'x', teacher)).toBe(
      false
    )
    expect(state().correctSessionMark('Mié 4 nov', 'Diego Torres', 'ausente', 'x', teacher)).toBe(
      false
    )
    expect(state().correctSessionMark('Mar 10 nov', 'Nadie', 'ausente', 'x', teacher)).toBe(false)
    expect(
      state().correctSessionMark('Mar 10 nov', 'Diego Torres', 'presente', 'Justificó.', teacher)
    ).toBe(true)
    expect(
      state().correctSessionMark('Mar 10 nov', 'Diego Torres', 'retraso', 'Error mío.', 'Lucía')
    ).toBe(true)
    expect(state().correctSessionMark('Mar 10 nov', 'Diego Torres', 'ausente', ' ', teacher)).toBe(
      true
    )
    expect(state().sessionMarks['Mar 10 nov']['Diego Torres']).toBe('ausente')
    expect(state().changes.map(({ from, to, reason, by }) => [from, to, reason, by])).toEqual([
      ['ausente', 'presente', 'Justificó.', teacher],
      ['presente', 'retraso', 'Error mío.', 'Lucía'],
      ['retraso', 'ausente', '', teacher]
    ])
  })
})

const row = (p: Page, name: string): Locator =>
  p.getByRole('row').filter({ has: p.getByRole('button', { name, exact: true }) })

// El reloj de la ventana queda parado en changedAt: los cambios guardan esa hora
// y los 300 ms de la nota solo pasan con page.clock.
async function withPanel(run: (p: Page) => Promise<void>): Promise<void> {
  const app = await launchHiddenElectron()
  try {
    const p = await app.firstWindow()
    await p.clock.install({ time: new Date(changedAt.getTime() - 10000) })
    // Se recarga el login para que los temporizadores del panel salgan del reloj instalado.
    await p.reload()
    await expect(p.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await p.clock.pauseAt(changedAt)
    await p.setViewportSize({ width: 1280, height: 900 })
    await p.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
    await p.getByLabel('Contraseña', { exact: true }).fill('Profesor123!')
    await p.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await run(p)
  } finally {
    await app.close()
  }
}

async function closeRollCall(p: Page): Promise<void> {
  await p.getByRole('button', { name: 'Abrir lista', exact: true }).click()
  await p.getByRole('button', { name: 'Cerrar lista', exact: true }).click()
  await p.getByRole('dialog').getByRole('button', { name: 'Cerrar lista', exact: true }).click()
  await expect(p.getByRole('button', { name: 'Volver a abrir', exact: true })).toBeVisible()
}

async function correct(
  p: Page,
  name: string,
  from: string,
  to: string,
  reason: string
): Promise<void> {
  await row(p, name).getByRole('button', { name: from, exact: true }).click()
  await p.getByRole('menu').getByRole('button', { name: to, exact: true }).click()
  const dialog = p.getByRole('dialog')
  await dialog.getByLabel('Motivo').fill(reason)
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(row(p, name).getByRole('button', { name: to, exact: true })).toBeVisible()
}

// «<quién> · <día> nov … <hh>:<mm>» con la hora local de la ventana, sin fijar el formato exacto.
async function signature(p: Page, by: string, at: Date): Promise<string> {
  const [day, hours, minutes] = await p.evaluate((time) => {
    const date = new Date(time)
    return [date.getDate(), date.getHours(), date.getMinutes()]
  }, at.getTime())
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${by} · ${day} nov\\D*${pad(hours)}:${pad(minutes)}`
}

async function center(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox()
  if (box === null) throw new Error('Element without box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('changes a mark after closing the roll call with a reason and shows the record', async () => {
  await withPanel(async (p) => {
    await closeRollCall(p)

    const torres = row(p, 'Diego Torres')
    await torres.getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Tarde', exact: true }).click()
    const dialog = p.getByRole('dialog', { name: 'Cambiar a Tarde' })
    await expect(dialog).toContainText('Diego Torres · Mié 11 nov 2026')
    await expect(dialog.getByLabel('Motivo')).toBeFocused()

    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(torres.getByRole('button', { name: 'Ausente', exact: true })).toBeVisible()

    await torres.getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Tarde', exact: true }).click()
    await expect(dialog.locator('label[for="correction-reason"]')).toHaveText(
      'Motivo · recomendado'
    )

    await dialog.getByLabel('Motivo').fill('Llegó a las 09:20 y el lector no lo registró.')
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(torres.getByRole('button', { name: 'Tarde', exact: true })).toBeVisible()

    // La nota sale al pasar por encima del estado, no al lado.
    await expect(torres.getByRole('button', { name: 'Editado' })).toHaveCount(0)
    const note = p.getByRole('tooltip')
    const status = torres.getByRole('button', { name: 'Tarde', exact: true })
    await status.hover()
    await expect(note).toContainText('De Ausente a Tarde')
    await expect(note).toContainText('Llegó a las 09:20 y el lector no lo registró.')
    await expect(note).toContainText(new RegExp(await signature(p, teacher, changedAt)))

    // Empieza en el borde de abajo de la zona del estado, sin hueco entre las dos.
    const noteTop = await note.evaluate((element) => element.getBoundingClientRect().top)
    const zoneBottom = await status.evaluate(
      (button) => button.parentElement?.getBoundingClientRect().bottom ?? Number.NaN
    )
    expect(Math.abs(noteTop - zoneBottom)).toBeLessThan(0.5)

    // Del estado al texto de la nota, y de vuelta al estado, la nota no se cierra.
    const toNote = await center(note.getByText('De Ausente a Tarde', { exact: true }))
    await p.mouse.move(toNote.x, toNote.y, { steps: 10 })
    await p.clock.runFor(1000)
    await expect(note).toContainText('De Ausente a Tarde')
    const toStatus = await center(status)
    await p.mouse.move(toStatus.x, toStatus.y, { steps: 10 })
    await p.clock.runFor(1000)
    await expect(note).toContainText('De Ausente a Tarde')

    // Fuera de los dos, se cierra a los 300 ms.
    await p.mouse.move(1, 1)
    await p.clock.runFor(299)
    await expect(note).toBeVisible()
    await p.clock.runFor(1)
    await expect(note).toHaveCount(0)

    // Con el teclado: la nota sale al llegar al estado y se cierra 300 ms después de salir.
    await torres.getByRole('button', { name: 'Diego Torres', exact: true }).focus()
    await status.focus()
    await expect(note).toContainText('De Ausente a Tarde')
    await torres.getByRole('button', { name: 'Diego Torres', exact: true }).focus()
    await p.clock.runFor(299)
    await expect(note).toBeVisible()
    await p.clock.runFor(1)
    await expect(note).toHaveCount(0)
    await row(p, 'Diego Molero').getByRole('button', { name: 'Ausente', exact: true }).hover()
    await expect(note).toContainText('Sin justificante')
    await expect(note).not.toContainText('De Ausente')
  })
})

test('changes a mark in a past session without a reason', async () => {
  await withPanel(async (p) => {
    await p
      .getByRole('navigation', { name: 'Secciones' })
      .getByRole('button', { name: 'Sesiones', exact: true })
      .click()
    await p.getByRole('button', { name: /Mar 10 nov/ }).click()

    const torres = row(p, 'Diego Torres')
    await torres.getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Presente', exact: true }).click()
    const dialog = p.getByRole('dialog', { name: 'Cambiar a Presente' })
    await expect(dialog.locator('label[for="correction-reason"]')).toHaveText(
      'Motivo · recomendado'
    )
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(dialog).toHaveCount(0)

    const status = torres.getByRole('button', { name: 'Presente', exact: true })
    await status.hover()
    const note = p.getByRole('tooltip')
    await expect(note).toContainText('De Ausente a Presente')
    const change = note.locator('span.flex-col.gap-1').first()
    await expect(change.locator(':scope > span')).toHaveText([
      'De Ausente a Presente',
      /^Ventura Rodriguez · /
    ])
  })
})

test('changes a mark in a past session with a reason and goes back with the back button', async () => {
  await withPanel(async (p) => {
    await p
      .getByRole('navigation', { name: 'Secciones' })
      .getByRole('button', { name: 'Sesiones', exact: true })
      .click()
    await p.getByRole('button', { name: /Mar 10 nov/ }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Mar 10 nov 2026' })).toBeVisible()

    const torres = row(p, 'Diego Torres')
    await torres.getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Presente', exact: true }).click()
    const dialog = p.getByRole('dialog', { name: 'Cambiar a Presente' })
    await dialog.getByLabel('Motivo').fill('Trajo el justificante de la tutora.')
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(torres.getByRole('button', { name: 'Presente', exact: true })).toBeVisible()
    await torres.getByRole('button', { name: 'Presente', exact: true }).hover()
    await expect(p.getByRole('tooltip')).toContainText('De Ausente a Presente')
    await expect(p.getByRole('tooltip')).toContainText('Trajo el justificante de la tutora.')

    await p.getByRole('button', { name: 'Diego Torres', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Diego Torres' })).toBeVisible()
    const toSession = p.getByRole('button', { name: 'Volver a Mar 10 nov 2026', exact: true })
    await expect(toSession).toHaveText('Mar 10 nov 2026')
    await toSession.click()
    await expect(p.getByRole('heading', { level: 1, name: 'Mar 10 nov 2026' })).toBeVisible()
    const toSessions = p.getByRole('button', { name: 'Volver a Sesiones', exact: true })
    await expect(toSessions).toHaveText('Sesiones')
    await toSessions.click()
    await expect(p.getByRole('heading', { level: 1, name: 'Sesiones' })).toBeVisible()
    await expect(p.getByRole('button', { name: /^Volver a/ })).toHaveCount(0)
  })
})

test('shows the newest change first in the note', async () => {
  await withPanel(async (p) => {
    await closeRollCall(p)
    await correct(p, 'Diego Torres', 'Ausente', 'Tarde', 'Llegó a las 09:20.')
    const later = new Date(changedAt.getTime() + 5 * 60000)
    await p.clock.runFor(5 * 60000)
    await correct(p, 'Diego Torres', 'Tarde', 'Presente', 'Estaba en el aula de música.')

    // Elegir el estado que ya tiene no abre el diálogo ni guarda otro cambio.
    const torres = row(p, 'Diego Torres')
    const status = torres.getByRole('button', { name: 'Presente', exact: true })
    await status.click()
    await p.getByRole('menu').getByRole('button', { name: 'Presente', exact: true }).click()
    await expect(p.getByRole('dialog')).toHaveCount(0)

    const note = p.getByRole('tooltip')
    await status.hover()
    await expect(note).toHaveText(
      new RegExp(
        [
          'De Tarde a Presente',
          'Estaba en el aula de música.',
          await signature(p, teacher, later),
          'De Ausente a Tarde',
          'Llegó a las 09:20.',
          await signature(p, teacher, changedAt)
        ].join('.*')
      )
    )
    expect((await note.textContent())?.match(/De \S+ a /g)).toHaveLength(2)
    // Los lectores de pantalla leen los mismos cambios, en el mismo orden.
    await expect(torres.locator('.sr-only')).toHaveText(
      `De Tarde a Presente. Estaba en el aula de música. ${teacher}. ` +
        `De Ausente a Tarde. Llegó a las 09:20. ${teacher}.`
    )
  })
})

test('signs a correction with the name of the teacher who is logged in', async () => {
  const app = await launchHiddenElectron([`--invitation=${invitedTeacher.code}`])
  try {
    const p = await app.firstWindow()
    await p.setViewportSize({ width: 1280, height: 900 })
    await expect(p.getByRole('heading', { level: 1, name: 'Hola, Lucía' })).toBeVisible()
    await p.getByLabel('Contraseña', { exact: true }).fill(chosenPassword)
    await p.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()

    await closeRollCall(p)
    await correct(p, 'Diego Torres', 'Ausente', 'Tarde', 'Llegó con el autobús del centro.')
    const note = p.getByRole('tooltip')
    await row(p, 'Diego Torres').getByRole('button', { name: 'Tarde', exact: true }).hover()
    await expect(note).toContainText('De Ausente a Tarde')
    await expect(note).toContainText(`${invitedTeacher.name} · `)
    await expect(note).not.toContainText(teacher)
  } finally {
    await app.close()
  }
})

test('keeps focus on the status after the first correction of a row and describes it', async () => {
  await withPanel(async (p) => {
    await p
      .getByRole('navigation', { name: 'Secciones' })
      .getByRole('button', { name: 'Sesiones', exact: true })
      .click()
    await p.getByRole('button', { name: /Mar 10 nov/ }).click()
    // Diego Molero llegó tarde: es una fila sin ausencia y sin cambios hasta ahora.
    await correct(p, 'Diego Molero', 'Tarde', 'Presente', 'El lector marcó tarde por error.')
    const status = row(p, 'Diego Molero').getByRole('button', { name: 'Presente', exact: true })
    await expect(status).toBeFocused()
    await expect(status).toHaveAccessibleDescription(
      `De Tarde a Presente. El lector marcó tarde por error. ${teacher}.`
    )
  })
})

test('does not save a correction without a teacher session', async () => {
  const app = await launchHiddenElectron()
  try {
    const p = await app.firstWindow()
    await p.setViewportSize({ width: 1280, height: 900 })
    await expect(p.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    // La ruta del panel se puede abrir sin entrar; los cambios no se firman sin sesión.
    await p.evaluate(() => {
      location.hash = '#/teacher/panel'
    })
    await expect(p.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await p
      .getByRole('navigation', { name: 'Secciones' })
      .getByRole('button', { name: 'Sesiones', exact: true })
      .click()
    await p.getByRole('button', { name: /Mar 10 nov/ }).click()
    const torres = row(p, 'Diego Torres')
    await torres.getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Presente', exact: true }).click()
    const dialog = p.getByRole('dialog', { name: 'Cambiar a Presente' })
    await dialog.getByLabel('Motivo').fill('Sin sesión no se firma.')
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(
      dialog.getByText('Entra con tu cuenta de profesor para guardar el cambio.')
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(torres.getByRole('button', { name: 'Ausente', exact: true })).toBeVisible()
  } finally {
    await app.close()
  }
})
