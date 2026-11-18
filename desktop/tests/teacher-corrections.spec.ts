import { expect, test, type Locator, type Page } from '@playwright/test'
import { usePanelStore } from '../src/renderer/src/panel/panelStore'
import { rosterNames } from '../src/renderer/src/panel/roster'
import { launchHiddenElectron } from './helpers/electron'

const teacher = 'Ventura Rodriguez'

test.describe('correction logic', () => {
  test.beforeEach(() => {
    usePanelStore.setState(usePanelStore.getInitialState(), true)
  })

  test('only corrects a closed roll call, with a reason, and records who, when and why', () => {
    const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
    const index = rosterNames.indexOf('Diego Torres')
    state().openSession()
    expect(state().correctTodayMark(index, 'retraso', 'Llegó tarde.', teacher)).toBe(false)
    state().closeSession()
    expect(state().marks[index]).toBe('ausente')
    for (const reason of ['', '   ']) {
      expect(state().correctTodayMark(index, 'retraso', reason, teacher)).toBe(false)
    }
    expect(state().correctTodayMark(index, 'pendiente', 'Sin dato.', teacher)).toBe(false)
    expect(state().correctTodayMark(index, 'ausente', 'Igual.', teacher)).toBe(false)
    expect(state().changes).toEqual([])

    const before = Date.now()
    expect(state().correctTodayMark(index, 'retraso', '  Llegó a las 09:20.  ', teacher)).toBe(true)
    expect(state().marks[index]).toBe('retraso')
    expect(state().changes).toHaveLength(1)
    expect(state().changes[0]).toMatchObject({
      session: 'Mié 11 nov 2026',
      student: 'Diego Torres',
      from: 'ausente',
      to: 'retraso',
      reason: 'Llegó a las 09:20.',
      by: teacher
    })
    expect(state().changes[0].at).toBeGreaterThanOrEqual(before)
  })

  test('keeps an accepted arrival out of Ausente after closing', () => {
    const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
    state().openSession()
    state().simulateArrival(0)
    state().closeSession()
    expect(state().correctTodayMark(0, 'ausente', 'Se fue.', teacher)).toBe(false)
    expect(state().correctTodayMark(0, 'retraso', 'Llegó tarde.', teacher)).toBe(true)
  })

  test('corrects a past session and keeps every change in order', () => {
    const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
    expect(state().correctSessionMark('Mar 10 nov', 'Diego Torres', 'presente', '', teacher)).toBe(
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
    expect(state().sessionMarks['Mar 10 nov']['Diego Torres']).toBe('retraso')
    expect(state().changes.map(({ from, to, by }) => [from, to, by])).toEqual([
      ['ausente', 'presente', teacher],
      ['presente', 'retraso', 'Lucía']
    ])
  })
})

const row = (p: Page, name: string): Locator =>
  p.getByRole('row').filter({ has: p.getByRole('button', { name, exact: true }) })

async function withPanel(run: (p: Page) => Promise<void>): Promise<void> {
  const app = await launchHiddenElectron()
  try {
    const p = await app.firstWindow()
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

test('changes a mark after closing the roll call only with a reason and shows the record', async () => {
  await withPanel(async (p) => {
    await p.getByRole('button', { name: 'Abrir lista', exact: true }).click()
    await p.getByRole('button', { name: 'Cerrar lista', exact: true }).click()
    await p.getByRole('dialog').getByRole('button', { name: 'Cerrar lista', exact: true }).click()

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
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(dialog.getByText('Escribe el motivo del cambio.')).toBeVisible()
    await expect(torres.getByRole('button', { name: 'Ausente', exact: true })).toBeVisible()

    await dialog.getByLabel('Motivo').fill('Llegó a las 09:20 y el lector no lo registró.')
    await dialog.getByRole('button', { name: 'Guardar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(torres.getByRole('button', { name: 'Tarde', exact: true })).toBeVisible()

    await torres.getByRole('button', { name: 'Editado', exact: true }).click()
    const log = p.getByRole('dialog', { name: 'Cambios' })
    await expect(log).toContainText('Diego Torres · Mié 11 nov 2026')
    await expect(log).toContainText('Llegó a las 09:20 y el lector no lo registró.')
    await expect(log).toContainText(teacher)
    await expect(log.locator('li .badge')).toHaveText(['Ausente', 'Tarde'])
    await log.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await expect(row(p, 'Diego Molero').getByRole('button', { name: 'Editado' })).toHaveCount(0)
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
    await expect(torres.getByRole('button', { name: 'Editado', exact: true })).toBeVisible()

    await p.getByRole('button', { name: 'Diego Torres', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Diego Torres' })).toBeVisible()
    await p.getByRole('button', { name: 'Volver a Mar 10 nov 2026', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Mar 10 nov 2026' })).toBeVisible()
    await p.getByRole('button', { name: 'Volver a Sesiones', exact: true }).click()
    await expect(p.getByRole('heading', { level: 1, name: 'Sesiones' })).toBeVisible()
    await expect(p.getByRole('button', { name: /^Volver a/ })).toHaveCount(0)
  })
})
