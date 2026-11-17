import { expect, test, type Page, type Locator } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'
import { nextDemoArrival, usePanelStore } from '../src/renderer/src/panel/panelStore'
import { rosterNames, todayEntry } from '../src/renderer/src/panel/roster'
import { useSettingsStore } from '../src/renderer/src/panel/settingsStore'
const time = new Date('2026-11-11T09:00:00Z')
const qr = (p: Page): Locator => p.getByRole('img', { name: 'QR de ejemplo', exact: true })
const row = (p: Page, name: string): Locator =>
  p.getByRole('row').filter({ has: p.getByRole('button', { name, exact: true }) })
async function seconds(p: Page, n: number): Promise<void> {
  await expect(
    p.getByText(`Cambia en ${n} ${n === 1 ? 'segundo' : 'segundos'}`, { exact: true })
  ).toBeVisible()
}
async function pattern(p: Page): Promise<string> {
  return qr(p).evaluate((e) => e.innerHTML)
}
async function tab(p: Page, name: string): Promise<void> {
  await p
    .getByRole('navigation', { name: 'Secciones' })
    .getByRole('button', { name, exact: true })
    .click()
}
async function withPanel(
  run: (p: Page) => Promise<void>,
  width = 1280,
  height = 900
): Promise<void> {
  const app = await launchHiddenElectron()
  try {
    const p = await app.firstWindow()
    await p.clock.install({ time: new Date(time.getTime() - 10000) })
    // Reload the initial login so all panel timers are created after clock installation.
    await p.reload()
    await expect(p.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
    await p.clock.pauseAt(time)
    await p.setViewportSize({ width, height })
    await p.getByLabel('Correo', { exact: true }).fill('profesor@atempo.test')
    await p.getByLabel('Contraseña', { exact: true }).fill('Profesor123!')
    await p.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(p.getByRole('heading', { name: 'Hoy', exact: true })).toBeVisible()
    await run(p)
  } finally {
    await app.close()
  }
}
async function open(p: Page): Promise<void> {
  await p.getByRole('button', { name: 'Abrir lista', exact: true }).click()
  await seconds(p, 30)
}

test('store re-derives lateness on a corrected time and never keeps a time for an absent student', () => {
  usePanelStore.setState(usePanelStore.getInitialState(), true)
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
  try {
    state().openSession()
    state().simulateArrival(0)
    expect(state().marks[0]).toBe('presente')
    state().setTime(0, '09:33')
    expect(state().marks[0]).toBe('retraso')
    state().setTime(0, '09:05')
    expect(state().marks[0]).toBe('presente')
    state().setMark(1, 'presente')
    state().setTime(1, '09:20')
    state().setMark(1, 'ausente')
    expect(state().times[1]).toBeUndefined()
    state().setTime(2, '09:40')
    expect(state().marks[2]).toBeUndefined()
    state().closeSession()
    expect(state().marks[2]).toBe('ausente')
    expect(state().times[2]).toBeUndefined()
  } finally {
    usePanelStore.setState(usePanelStore.getInitialState(), true)
    useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  }
})

test('saves a time edit made after cancelling a previous edit with Escape', async () => {
  await withPanel(async (p) => {
    await open(p)
    await p.getByRole('button', { name: 'Simular llegada', exact: true }).click()
    const diego = row(p, 'Diego Molero')
    await diego.getByRole('button', { name: todayEntry[0], exact: true }).click()
    await diego.locator('input[type=time]').press('Escape')
    await diego.getByRole('button', { name: todayEntry[0], exact: true }).click()
    await diego.locator('input[type=time]').fill('09:05')
    await diego.locator('input[type=time]').press('Enter')
    await expect(diego.getByRole('button', { name: '09:05', exact: true })).toBeVisible()
    await expect(diego.locator('input[type=time]')).toHaveCount(0)
  })
})

test('keeps one mark menu open at a time and closes it on scroll', async () => {
  await withPanel(async (p) => {
    await open(p)
    await row(p, 'Diego Molero').getByRole('button', { name: 'Pendiente', exact: true }).click()
    await expect(p.getByRole('menu')).toHaveCount(1)
    await row(p, 'Diego Torres').getByRole('button', { name: 'Pendiente', exact: true }).click()
    await expect(p.getByRole('menu')).toHaveCount(1)
    await p.mouse.wheel(0, 200)
    await expect(p.getByRole('menu')).toHaveCount(0)
  })
})

test('store rejects invalid and duplicate arrivals, guards only evidence, respects margin and resets new sessions', () => {
  const initial = usePanelStore.getInitialState()
  const preferences = useSettingsStore.getInitialState()
  usePanelStore.setState(initial, true)
  useSettingsStore.setState(preferences, true)
  const state = (): ReturnType<typeof usePanelStore.getState> => usePanelStore.getState()
  try {
    state().simulateArrival(0)
    expect(state().marks).toEqual({})
    state().openSession()
    for (const i of [-1, 0.5, rosterNames.length, 9, NaN]) state().simulateArrival(i)
    expect(state().marks).toEqual({})
    expect(nextDemoArrival({}, {})).toBe(0)
    state().simulateArrival(0)
    expect(state().marks[0]).toBe('presente')
    expect(state().times[0]).toBe(todayEntry[0])
    for (const mark of ['ausente', 'pendiente'] as const) {
      state().setMark(0, mark)
      expect(state().marks[0]).toBe('presente')
    }
    state().setMark(0, 'retraso')
    state().setTime(0, '09:33')
    state().simulateArrival(0)
    expect(state().marks[0]).toBe('retraso')
    expect(state().times[0]).toBe('09:33')
    state().setMark(1, 'ausente')
    state().simulateArrival(1)
    state().setTime(2, '09:40')
    state().simulateArrival(2)
    expect(state().marks[1]).toBe('ausente')
    expect(state().marks[2]).toBeUndefined()
    expect(state().times[2]).toBe('09:40')
    expect(nextDemoArrival(state().marks, state().times)).toBe(3)
    state().simulateArrival(10)
    expect(state().marks[10]).toBe('retraso')
    useSettingsStore.getState().update({ lateMinutes: 14 })
    state().simulateArrival(14)
    expect(state().marks[14]).toBe('presente')
    state().setSessionMark('Mar 10 nov', rosterNames[0], 'ausente')
    expect(state().sessionMarks['Mar 10 nov'][rosterNames[0]]).toBe('ausente')
    state().closeSession()
    state().simulateArrival(3)
    expect(state().times[3]).toBeUndefined()
    expect(state().marks[0]).toBe('retraso')
    state().reopenSession()
    state().setMark(0, 'pendiente')
    expect(state().marks[0]).toBe('retraso')
    expect(state().demoArrivals[0]).toBe(true)
    state().openSession()
    expect(state().demoArrivals).toEqual({})
    expect(state().times).toEqual({})
    expect(state().marks).toEqual({})
    expect(
      nextDemoArrival(Object.fromEntries(rosterNames.map((_, i) => [i, 'ausente' as const])), {})
    ).toBe(-1)
  } finally {
    usePanelStore.setState(initial, true)
    useSettingsStore.setState(preferences, true)
  }
})

test('rotates exactly at 29/30/60/90 without attendance from ticks', async () => {
  await withPanel(async (p) => {
    await open(p)
    const patterns = [await pattern(p)]
    await p.clock.runFor(29000)
    await seconds(p, 1)
    expect(await pattern(p)).toBe(patterns[0])
    for (const n of [1000, 30000, 30000]) {
      await p.clock.runFor(n)
      await seconds(p, 30)
      patterns.push(await pattern(p))
    }
    expect(new Set(patterns).size).toBe(4)
    await expect(p.getByRole('button', { name: 'Pendiente', exact: true })).toHaveCount(15)
  })
})
test('recovers delayed callbacks and background, tab and student navigation without resetting opening', async () => {
  await withPanel(async (p) => {
    await open(p)
    const first = await pattern(p)
    await p.clock.runFor(29000)
    await p.clock.fastForward(37000)
    await seconds(p, 24)
    const third = await pattern(p)
    expect(third).not.toBe(first)
    await tab(p, 'Sesiones')
    await expect(qr(p)).toHaveCount(0)
    await p.clock.fastForward(90000)
    await tab(p, 'Dashboard')
    await seconds(p, 24)
    expect(await pattern(p)).not.toBe(third)
    await p.getByRole('button', { name: 'Diego Molero', exact: true }).click()
    await expect(qr(p)).toHaveCount(0)
    await p.clock.fastForward(60000)
    await p
      .getByRole('navigation', { name: 'Ruta' })
      .getByRole('button', { name: 'Hoy', exact: true })
      .click()
    await seconds(p, 24)
    const beforeRecovery = await pattern(p)
    await p.clock.setSystemTime(new Date(time.getTime() + 247000))
    await p.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'))
      window.dispatchEvent(new Event('focus'))
    })
    await seconds(p, 23)
    expect(await pattern(p)).not.toBe(beforeRecovery)
    await expect(p.getByRole('button', { name: 'Pendiente', exact: true })).toHaveCount(15)
  })
})
test('unmount clears the QR interval and recovery listeners before remount', async () => {
  await withPanel(async (p) => {
    // Observe public browser APIs only; the renderer/store has no test hooks.
    const observation = await p.evaluateHandle(() => {
      const intervals = new Set<number>()
      const listeners = new Set<EventListenerOrEventListenerObject>()
      const setInterval = window.setInterval.bind(window)
      const clearInterval = window.clearInterval.bind(window)
      window.setInterval = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
        const id = setInterval(callback, delay, ...args)
        if (delay === 1000) intervals.add(id)
        return id
      }) as typeof window.setInterval
      window.clearInterval = (id) => {
        if (id !== undefined) intervals.delete(Number(id))
        clearInterval(id)
      }
      for (const [target, type] of [
        [document, 'visibilitychange'],
        [window, 'focus']
      ] as const) {
        const add = target.addEventListener.bind(target)
        const remove = target.removeEventListener.bind(target)
        target.addEventListener = ((
          event: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions
        ) => {
          if (event === type) listeners.add(listener)
          add(event, listener, options)
        }) as typeof target.addEventListener
        target.removeEventListener = ((
          event: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | EventListenerOptions
        ) => {
          if (event === type) listeners.delete(listener)
          remove(event, listener, options)
        }) as typeof target.removeEventListener
      }
      return { intervals, listeners }
    })
    const counts = (): Promise<number[]> =>
      observation.evaluate((o) => [o.intervals.size, o.listeners.size])
    await open(p)
    expect(await counts()).toEqual([1, 1])
    await tab(p, 'Sesiones')
    expect(await counts()).toEqual([0, 0])
    await p.clock.fastForward(66000)
    await tab(p, 'Dashboard')
    await seconds(p, 24)
    expect(await counts()).toEqual([1, 1])
    await p.getByRole('button', { name: 'Diego Molero', exact: true }).click()
    expect(await counts()).toEqual([0, 0])
    await p.evaluate(() => {
      location.hash = '#/'
    })
    expect(await counts()).toEqual([0, 0])
    await observation.dispose()
  })
})

test('simulates next eligible arrival, preserves manual marks and exhausts valid fixtures', async () => {
  await withPanel(async (p) => {
    await open(p)
    await p.getByRole('button', { name: 'Simular llegada', exact: true }).press('Enter')
    const diego = row(p, 'Diego Molero')
    await diego.getByRole('button', { name: todayEntry[0], exact: true }).click()
    await diego.locator('input[type=time]').fill('09:33')
    await diego.locator('input[type=time]').press('Enter')
    // La hora corregida pasa el margen: el estado cambia solo a Tarde.
    await diego.getByRole('button', { name: 'Tarde', exact: true }).click()
    await expect(
      p.getByRole('menu').getByRole('button', { name: 'Ausente', exact: true })
    ).toHaveCount(0)
    await p.getByRole('menu').getByRole('button', { name: 'Tarde', exact: true }).click()
    const other = row(p, 'Diego Torres')
    await other.getByRole('button', { name: 'Pendiente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Ausente', exact: true }).click()
    await p.clock.fastForward(66000)
    await expect(diego.getByRole('button', { name: 'Tarde', exact: true })).toBeVisible()
    await expect(other.getByRole('button', { name: 'Ausente', exact: true })).toBeVisible()
    await expect(diego.getByRole('button', { name: '09:33', exact: true })).toBeVisible()
    for (let i = 0; i < 12; i++)
      await p.getByRole('button', { name: 'Simular llegada', exact: true }).click()
    await expect(p.getByRole('button', { name: 'Simular llegada', exact: true })).toBeDisabled()
    await expect(
      row(p, 'Miguel Rodriguez').getByRole('button', { name: 'Tarde', exact: true })
    ).toBeVisible()
    await expect(
      row(p, 'Meghan Martin').getByRole('button', { name: 'Pendiente', exact: true })
    ).toBeVisible()
  })
})
test('cancel preserves period, close preserves arrival/manual marks, reopen starts at 30', async () => {
  await withPanel(async (p) => {
    await open(p)
    await p.getByRole('button', { name: 'Simular llegada', exact: true }).click()
    await row(p, 'Diego Torres').getByRole('button', { name: 'Pendiente', exact: true }).click()
    await p.getByRole('menu').getByRole('button', { name: 'Tarde', exact: true }).click()
    await p.clock.runFor(29000)
    const before = await pattern(p)
    await p.getByRole('button', { name: 'Cerrar lista', exact: true }).click()
    await p.getByRole('dialog').getByRole('button', { name: 'Volver', exact: true }).click()
    await seconds(p, 1)
    expect(await pattern(p)).toBe(before)
    await p.clock.runFor(1000)
    await seconds(p, 30)
    await p.getByRole('button', { name: 'Cerrar lista', exact: true }).click()
    await p.getByRole('dialog').getByRole('button', { name: 'Cerrar lista', exact: true }).click()
    await expect(qr(p)).toHaveCount(0)
    await expect(p.getByText(/^Cambia en/)).toHaveCount(0)
    await expect(p.getByRole('button', { name: 'Simular llegada', exact: true })).toHaveCount(0)
    const closed = await p.locator('tbody').innerText()
    await p.clock.fastForward(66000)
    expect(await p.locator('tbody').innerText()).toBe(closed)
    await p.getByRole('button', { name: 'Volver a abrir', exact: true }).click()
    await seconds(p, 30)
    await expect(
      row(p, 'Diego Molero').getByRole('button', { name: 'Presente', exact: true })
    ).toBeVisible()
    await expect(
      row(p, 'Diego Torres').getByRole('button', { name: 'Tarde', exact: true })
    ).toBeVisible()
    await row(p, 'Diego Molero').getByRole('button', { name: 'Presente', exact: true }).click()
    await expect(
      p.getByRole('menu').getByRole('button', { name: 'Ausente', exact: true })
    ).toHaveCount(0)
  })
})
for (const theme of ['oscuro', 'claro'])
  for (const [layout, width, height] of [
    ['desktop', 1280, 900],
    ['movil', 390, 844]
  ] as const) {
    test(`QR appearance ${theme} ${layout}`, async () => {
      await withPanel(
        async (p) => {
          await p.evaluate(
            (value) => document.documentElement.setAttribute('data-theme', `atempo-${value}`),
            theme
          )
          await open(p)
          const simulate = p.getByRole('button', { name: 'Simular llegada', exact: true })
          await simulate.focus()
          await expect(simulate).toBeFocused()
          await simulate.press('Enter')
          await expect(
            row(p, 'Diego Molero').getByRole('button', { name: 'Presente', exact: true })
          ).toBeVisible()
          await seconds(p, 30)
          await expect(qr(p)).toBeVisible()
          expect(
            await p.getByText(/^Cambia en/).evaluate((e) => e.closest('[aria-live]'))
          ).toBeNull()
          expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
            true
          )
          await p.mouse.move(width - 1, height - 1)
          await p.evaluate(() => document.fonts.ready)
          await p.screenshot({
            path: test.info().outputPath(`teacher-qr-${theme}-${layout}.png`),
            animations: 'disabled'
          })
          const arrival = row(p, 'Diego Molero')
          const nameBox = await arrival
            .getByRole('button', { name: 'Diego Molero', exact: true })
            .boundingBox()
          const timeBox = await arrival
            .getByRole('button', { name: todayEntry[0], exact: true })
            .boundingBox()
          expect(nameBox).not.toBeNull()
          expect(timeBox).not.toBeNull()
          if (nameBox && timeBox) {
            console.log(
              `Arrival geometry ${theme} ${layout}: ${JSON.stringify({ nameBox, timeBox })}`
            )
            expect(
              nameBox.x + nameBox.width,
              'Student name and arrival time must remain readable without overlap'
            ).toBeLessThanOrEqual(timeBox.x)
          }
          const geometry = await p.locator('tbody tr').evaluateAll((rows) =>
            rows.map((tr) =>
              [...tr.querySelectorAll('td')].map((cell) => {
                const control = cell.querySelector('button') ?? cell
                const range = document.createRange()
                range.selectNodeContents(control.querySelector('.whitespace-nowrap') ?? control)
                const text = range.getBoundingClientRect()
                const rect = control.getBoundingClientRect()
                return {
                  text: control.getAttribute('aria-label') ?? control.textContent?.trim(),
                  x: rect.x,
                  right: rect.right,
                  top: rect.top,
                  bottom: rect.bottom,
                  textX: text.x,
                  textRight: text.right,
                  clipped: control.scrollWidth > control.clientWidth
                }
              })
            )
          )
          expect(geometry).toHaveLength(15)
          for (const [index, boxes] of geometry.entries()) {
            expect(boxes[0].text).toBe(rosterNames[index])
            expect(boxes[0].clipped, `Full name ${rosterNames[index]}`).toBe(false)
            for (let i = 0; i < boxes.length - 1; i++) {
              expect(
                Math.max(boxes[i].right, boxes[i].textRight),
                `${theme} ${layout} ${rosterNames[index]} cells ${i}/${i + 1}`
              ).toBeLessThanOrEqual(Math.min(boxes[i + 1].x, boxes[i + 1].textX))
            }
          }
          const scroller = p.locator('table.table-roster').locator('..')
          const dimensions = await scroller.evaluate((e) => ({
            client: e.clientWidth,
            scroll: e.scrollWidth,
            left: e.scrollLeft
          }))
          if (layout === 'movil') {
            expect(dimensions.scroll).toBeGreaterThan(dimensions.client)
            const status = arrival.getByRole('button', { name: 'Presente', exact: true })
            await status.focus()
            await expect(status).toBeFocused()
            expect(await scroller.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0)
            await expect(status).toBeInViewport()
            await status.press('Enter')
            const choice = p
              .getByRole('menu')
              .getByRole('button', { name: 'Presente', exact: true })
            await choice.focus()
            await expect(choice).toBeFocused()
            await choice.press('Enter')
            const entry = arrival.getByRole('button', { name: todayEntry[0], exact: true })
            await entry.focus()
            await expect(entry).toBeFocused()
            await expect(entry).toBeInViewport()
            await entry.press('Enter')
            const editor = arrival.locator('input[type=time]')
            await expect(editor).toBeFocused()
            await editor.fill(todayEntry[0])
            await editor.press('Enter')
            await expect(entry).toBeVisible()
            await arrival.getByRole('button', { name: 'Diego Molero', exact: true }).focus()
            await scroller.evaluate((e) => {
              e.scrollLeft = 0
            })
            expect(await scroller.evaluate((e) => e.scrollLeft)).toBe(0)
          }
          console.log(
            `Roster geometry ${theme} ${layout}: ${JSON.stringify({ geometry, dimensions, keyboard: layout === 'movil' })}`
          )
          await simulate.focus()
          await p.evaluate(() => window.scrollTo(0, 0))
          await p.mouse.move(width - 1, height - 1)
          await expect(p).toHaveScreenshot(`teacher-qr-${theme}-${layout}.png`, {
            animations: 'disabled'
          })
        },
        width,
        height
      )
    })
  }
