import { expect, test, type Locator, type Page } from '@playwright/test'
import { launchHiddenElectron } from './helpers/electron'

// Seis sesiones celebradas. Mié 4 nov está cancelada y no entra en el porcentaje.
const shareWithoutCancelledSession: Record<string, string> = {
  'Diego Molero': '100 %',
  'Diego Torres': '83 %',
  'Ella Deyavorsky': '100 %',
  'Esther Patino': '83 %',
  'Jimena Duran': '100 %',
  'Jose Miguel': '100 %',
  'Luis Duque': '83 %',
  'Manuel Diaz': '100 %',
  'Maria Osipuk': '100 %',
  'Meghan Martin': '67 %',
  'Miguel Rodriguez': '100 %',
  'Raul Santamaria': '100 %',
  'Sergio Cortes': '100 %',
  'Sergio Moras': '100 %',
  'Victor Chang': '100 %'
}

const riskSessions = ['Mar 10 nov 2026', 'Lun 9 nov 2026', 'Vie 6 nov 2026', 'Jue 5 nov 2026']

type BodyStyle = {
  fontFamily: string
  backgroundColor: string
}

test.describe.configure({ timeout: 60_000 })

async function withPanel(
  run: (window: Page) => Promise<void>,
  size = { width: 1440, height: 900 }
): Promise<void> {
  await withApp([], size, async (window) => {
    await expect(window.getByRole('button', { name: 'Entrar' })).toBeVisible()
    expect(await window.evaluate(() => globalThis.location.hash)).toBe('')
    await window.evaluate(() => {
      globalThis.location.hash = '#/teacher/panel'
    })
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await run(window)
  })
}

async function withApp(
  flags: string[],
  size: { width: number; height: number },
  run: (window: Page) => Promise<void>
): Promise<void> {
  const app = await launchHiddenElectron([...flags])
  try {
    const window = await app.firstWindow()
    await window.setViewportSize(size)
    await window.evaluate(() => document.fonts.ready)
    await run(window)
  } finally {
    await app.close()
  }
}

async function openTab(window: Page, label: string, title: string): Promise<void> {
  await window
    .getByRole('navigation', { name: 'Secciones' })
    .getByRole('button', { name: label })
    .click()
  await expect(window.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

// El ratón sale de la barra lateral para que ningún botón quede en hover en la captura.
async function expectScreen(window: Page, name: string): Promise<void> {
  const size = window.viewportSize()
  if (size === null) throw new Error('La ventana no tiene tamaño.')
  await window.mouse.move(size.width - 1, size.height - 1)
  await window.evaluate(() => document.fonts.ready)
  await expect.soft(window).toHaveScreenshot(name, { animations: 'disabled' })
}

function readBodyStyle(window: Page): Promise<BodyStyle> {
  return window.locator('body').evaluate((body) => {
    const style = getComputedStyle(body)
    return {
      fontFamily: style.fontFamily,
      backgroundColor: style.backgroundColor
    }
  })
}

function sessionRow(window: Page, label: string): Locator {
  return window.getByRole('row').filter({
    has: window.getByRole('button', { name: label })
  })
}

function award(window: Page, title: string): Locator {
  return window.getByRole('article').filter({
    has: window.getByRole('heading', { name: title, exact: true })
  })
}

type AttendanceScroll = {
  overflowX: string
  overflowY: string
  scrollHeight: number
  clientHeight: number
  scrollWidth: number
  clientWidth: number
  scrollTop: number
  scrollLeft: number
  headerTop: number
  headerBottom: number
  dateHeaderTop: number
  boxTop: number
  boxBottom: number
  boxLeft: number
  nameLeft: number
  lastRowTop: number
  lastRowBottom: number
}

async function readAttendanceScroll(grid: Locator): Promise<AttendanceScroll> {
  return grid.evaluate((element) => {
    const nameHeader = element.querySelector('thead th.attendance-name')
    const dateHeader = element.querySelector('thead th.attendance-date')
    const lastRow = element.querySelector('tbody tr:last-child')
    if (nameHeader === null || dateHeader === null || lastRow === null) {
      throw new Error('La cuadrícula no tiene cabecera o filas.')
    }
    const box = element.getBoundingClientRect()
    const nameBox = nameHeader.getBoundingClientRect()
    const dateBox = dateHeader.getBoundingClientRect()
    const lastBox = lastRow.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft,
      headerTop: nameBox.top,
      headerBottom: nameBox.bottom,
      dateHeaderTop: dateBox.top,
      boxTop: box.top,
      boxBottom: box.bottom,
      boxLeft: box.left,
      nameLeft: nameBox.left,
      lastRowTop: lastBox.top,
      lastRowBottom: lastBox.bottom
    }
  })
}

function headerStaysInTheCard(scroll: AttendanceScroll): void {
  expect(Math.abs(scroll.headerTop - scroll.boxTop)).toBeLessThan(2)
  expect(Math.abs(scroll.dateHeaderTop - scroll.boxTop)).toBeLessThan(2)
  expect(scroll.headerBottom).toBeGreaterThan(scroll.boxTop)
  expect(scroll.headerBottom).toBeLessThanOrEqual(scroll.boxBottom)
}

test('shows the cancelled session in Sesiones without opening the roll call', async () => {
  await withPanel(async (window) => {
    await window.getByRole('button', { name: 'Sesiones' }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Sesiones' })).toBeVisible()

    const cancelled = sessionRow(window, 'Mié 4 nov 2026')
    await expect(cancelled.getByRole('cell', { name: 'Cancelada', exact: true })).toBeVisible()
    await expect(cancelled.getByRole('button', { name: 'Mié 4 nov 2026' })).toBeDisabled()
    await expect(window.getByRole('cell', { name: 'Cancelada', exact: true })).toHaveCount(1)

    for (const label of riskSessions) {
      const row = sessionRow(window, label)
      await expect(row.getByRole('button', { name: label })).toBeEnabled()
      await expect(row.getByRole('cell', { name: 'Cancelada', exact: true })).toHaveCount(0)
    }

    await cancelled.getByRole('cell', { name: 'Cancelada', exact: true }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Sesiones' })).toBeVisible()
    await expect(window.getByRole('heading', { level: 1, name: 'Mié 4 nov 2026' })).toHaveCount(0)
    await expect(window.getByRole('columnheader', { name: 'Estado' })).toHaveCount(0)
  })
})

test('groups the Sesiones counts under Alumnos and lines up the dates', async () => {
  await withPanel(async (window) => {
    await window.getByRole('button', { name: 'Sesiones' }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Sesiones' })).toBeVisible()

    const group = window.getByRole('columnheader', { name: 'Alumnos', exact: true })
    await expect(group).toHaveAttribute('colspan', '3')
    await expect(group).toHaveAttribute('scope', 'colgroup')
    const groupBox = await group.boundingBox()
    for (const name of ['Presentes', 'Tarde', 'Ausentes']) {
      const column = await window.getByRole('columnheader', { name, exact: true }).boundingBox()
      expect(groupBox).not.toBeNull()
      expect(column).not.toBeNull()
      if (groupBox && column) {
        expect(column.y).toBeGreaterThanOrEqual(groupBox.y + groupBox.height - 1)
        expect(column.x).toBeGreaterThanOrEqual(groupBox.x - 1)
        expect(column.x + column.width).toBeLessThanOrEqual(groupBox.x + groupBox.width + 1)
      }
    }

    // El día del mes empieza en el mismo sitio, sea cual sea el día de la semana.
    const days = window.locator('tbody tr td:first-child button > span:nth-child(2)')
    await expect(days).toHaveCount(7)
    const starts = await days.evaluateAll((spans) =>
      spans.map((span) => Math.round(span.getBoundingClientRect().left))
    )
    expect(new Set(starts).size).toBe(1)
  })
})

test('shows the cancelled session in the grid and leaves it out of the share and the awards', async () => {
  await withPanel(async (window) => {
    await window.getByRole('button', { name: 'Estadísticas' }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible()

    const table = window.getByRole('table').filter({
      has: window.getByRole('columnheader', { name: 'Alumno' })
    })
    await expect(table.getByRole('columnheader', { name: /Mié\s*4/ })).toHaveClass(
      /cancelled-column/
    )
    await expect(table.getByRole('button', { name: /· 4 nov 2026 · Cancelada/ })).toHaveCount(15)
    await expect(table.getByRole('button', { name: /Cancelada/ })).toHaveCount(15)
    await expect(
      table
        .getByRole('button', { name: /Manuel Diaz · 4 nov 2026 · Cancelada/ })
        .locator('.mark-cancelada')
    ).toBeVisible()

    for (const [name, share] of Object.entries(shareWithoutCancelledSession)) {
      const student = table.getByRole('row', { name })
      await expect(student.getByText(share, { exact: true })).toBeVisible()
    }

    const neverMiss = award(window, 'Nunca falta')
    const onTime = award(window, 'Siempre a tiempo')
    await expect(neverMiss).toContainText('Asistencia completa')
    await expect(onTime).toContainText('Siempre puntual')
    await expect(neverMiss.getByRole('button', { name: 'Manuel Diaz', exact: true })).toBeVisible()
    await expect(neverMiss.getByRole('button', { name: 'Meghan Martin', exact: true })).toHaveCount(
      0
    )
    await expect(onTime.getByRole('button', { name: 'Manuel Diaz', exact: true })).toBeVisible()
    await expect(onTime.getByRole('button', { name: 'Diego Molero', exact: true })).toHaveCount(0)
  })
})

test('keeps the risk hints from Mar 10, Lun 9, Vie 6 and Jue 5', async () => {
  await withPanel(async (window) => {
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()

    const meghan = window.getByRole('row', { name: /Meghan Martin/ })
    const meghanHint = meghan.getByText('Puede faltar', { exact: true })
    await expect(meghanHint).toBeVisible()
    await meghanHint.hover()
    await expect(window.getByText('Ha faltado 2 veces en las últimas 4 clases.')).toBeVisible()

    const miguel = window.getByRole('row', { name: /Miguel Rodriguez/ })
    const miguelHint = miguel.getByText('Puede llegar tarde', { exact: true })
    await expect(miguelHint).toBeVisible()
    await miguelHint.hover()
    await expect(
      window.getByText('Ha llegado tarde 3 veces en las últimas 4 clases.')
    ).toBeVisible()
  })
})

test('scrolls the fifteen students inside the card and keeps the header visible', async () => {
  await withPanel(async (window) => {
    // 1024 px sigue en escritorio y deja las sesiones más anchas que la tarjeta.
    await window.setViewportSize({ width: 1024, height: 900 })
    await window.getByRole('button', { name: 'Estadísticas' }).click()
    await expect(window.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible()

    const grid = window.getByRole('region', {
      name: /en vertical para ver más alumnos y en horizontal para ver más sesiones/
    })
    const table = grid.getByRole('table')
    await expect(table.locator('tbody tr')).toHaveCount(15)
    for (const name of Object.keys(shareWithoutCancelledSession)) {
      await expect(table.getByRole('button', { name, exact: true })).toBeVisible()
    }

    const before = await readAttendanceScroll(grid)
    expect(before.overflowY).toBe('auto')
    expect(before.overflowX).toBe('auto')
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight)
    expect(before.scrollWidth).toBeGreaterThan(before.clientWidth)
    expect(before.scrollTop).toBe(0)
    expect(before.lastRowTop).toBeGreaterThanOrEqual(before.boxBottom - 1)
    headerStaysInTheCard(before)
    await expect(grid.getByRole('columnheader', { name: 'Alumno' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Ver sesiones anteriores' })).toBeDisabled()
    await expect(window.getByRole('button', { name: 'Ver sesiones siguientes' })).toBeEnabled()

    const pageScroll = (): Promise<number> =>
      window.evaluate(() => document.scrollingElement?.scrollTop ?? 0)
    const pageBefore = await pageScroll()
    await grid.hover()
    await window.mouse.wheel(0, 120)
    await expect.poll(async () => (await readAttendanceScroll(grid)).scrollTop).toBeGreaterThan(40)
    const wheeled = await readAttendanceScroll(grid)
    expect(await pageScroll()).toBe(pageBefore)
    headerStaysInTheCard(wheeled)

    await grid.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const down = await readAttendanceScroll(grid)
    expect(down.scrollTop).toBeGreaterThanOrEqual(down.scrollHeight - down.clientHeight - 1)
    expect(await pageScroll()).toBe(pageBefore)
    headerStaysInTheCard(down)
    expect(down.lastRowBottom).toBeLessThanOrEqual(down.boxBottom + 2)
    expect(down.lastRowTop).toBeGreaterThanOrEqual(down.headerBottom - 2)
    await expect(grid.getByRole('columnheader', { name: 'Alumno' })).toBeVisible()

    await window.getByRole('button', { name: 'Ver sesiones siguientes' }).click()
    const across = await readAttendanceScroll(grid)
    expect(across.scrollLeft).toBeGreaterThan(0)
    expect(across.scrollTop).toBeGreaterThan(100)
    headerStaysInTheCard(across)
    expect(Math.abs(across.nameLeft - across.boxLeft)).toBeLessThan(2)
    await expect(window.getByRole('button', { name: 'Ver sesiones anteriores' })).toBeEnabled()

    const cell = table.getByRole('button', { name: / · / }).first()
    const label = await cell.getAttribute('aria-label')
    if (label === null) throw new Error('La celda no tiene nombre accesible.')
    const [student, day] = label.split(' · ')
    const detailText = `${student} · ${day}`

    await cell.press('Enter')
    const detail = window.getByRole('status')
    await expect(detail).toContainText(detailText)
    const regionBox = await grid.boundingBox()
    const detailBox = await detail.boundingBox()
    if (regionBox === null || detailBox === null) {
      throw new Error('No se ha podido medir la cuadrícula o el detalle.')
    }
    expect(detailBox.y).toBeGreaterThanOrEqual(regionBox.y + regionBox.height - 1)
    await detail.getByRole('button', { name: 'Cerrar' }).click()
    await expect(detail).toHaveCount(0)

    await cell.press(' ')
    await expect(window.getByRole('status')).toContainText(detailText)
    await window.getByRole('status').getByRole('button', { name: 'Cerrar' }).click()
    await expect(window.getByRole('status')).toHaveCount(0)

    await cell.click()
    await expect(window.getByRole('status')).toContainText(detailText)
  })
})

test('rejects an unknown account and still opens the panel through the shared router', async () => {
  await withApp([], { width: 1440, height: 900 }, async (window) => {
    expect(await window.evaluate(() => globalThis.location.hash)).toBe('')
    await window.getByLabel('Correo').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta')
    await window.getByRole('button', { name: 'Entrar' }).click()

    await expect(window.getByRole('alert')).toHaveText('El correo o la contraseña no coinciden.')
    await expect(window.getByRole('status')).toHaveCount(0)
    const text = await window.locator('body').innerText()
    expect(text).not.toContain('ana@clase.test')
    expect(text).not.toContain('secreta')
    expect(await window.evaluate(() => globalThis.location.hash)).toBe('')
    await window.evaluate(() => {
      document.body.dataset.navigationMarker = 'same-page'
      globalThis.location.hash = '#/teacher/panel'
    })
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    expect(await window.evaluate(() => globalThis.location.hash)).toBe('#/teacher/panel')
    expect(await window.evaluate(() => document.body.dataset.navigationMarker)).toBe('same-page')
  })
})

test('opens the panel through the router after a normal startup', async () => {
  await withPanel(async (window) => {
    expect(await window.evaluate(() => globalThis.location.hash)).toBe('#/teacher/panel')
    await expect(window.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
    await expect(window.getByLabel('Correo')).toHaveCount(0)
    await expect(window.getByRole('button', { name: 'Entrar' })).toHaveCount(0)
  })
})

test('matches the desktop panel screens with their snapshots', async () => {
  await withPanel(async (window) => {
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expectScreen(window, 'panel-hoy.png')

    await openTab(window, 'Sesiones', 'Sesiones')
    await expectScreen(window, 'panel-sesiones.png')

    await openTab(window, 'Estadísticas', 'Estadísticas')
    const grid = window.getByRole('region', { name: /^Asistencia por fecha/ })
    await grid
      .getByRole('button', { name: /^Manuel Diaz · / })
      .first()
      .click()
    await expect(window.getByRole('status')).toContainText('Manuel Diaz')
    await expectScreen(window, 'panel-estadisticas.png')

    await openTab(window, 'Ajustes', 'Ajustes')
    await expectScreen(window, 'panel-ajustes.png')
  })
})

test('matches Estadísticas at 390 px with its snapshot', async () => {
  await withPanel(
    async (window) => {
      await openTab(window, 'Estadísticas', 'Estadísticas')
      const summary = window.getByRole('region', { name: 'Asistencia por alumno' })
      await expect(summary).toBeVisible()
      await expect(window.getByRole('region', { name: /^Asistencia por fecha/ })).toBeHidden()
      await expectScreen(window, 'panel-estadisticas-movil.png')
    },
    { width: 390, height: 844 }
  )
})

test('changes the panel colors and font with the light theme', async () => {
  await withPanel(async (window) => {
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-oscuro')
    const dark = await readBodyStyle(window)

    await window.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'atempo-claro')
    })
    await window.evaluate(() => document.fonts.ready)

    const light = await readBodyStyle(window)
    expect(light.fontFamily).toContain('Inter')
    expect(light.backgroundColor).not.toBe(dark.backgroundColor)

    await expect(window.locator('html')).toHaveAttribute('data-theme', 'atempo-claro')
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expectScreen(window, 'panel-claro.png')
  })
})

test('matches a student file on desktop with its snapshot', async () => {
  await withPanel(async (window) => {
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await window.getByRole('button', { name: 'Meghan Martin', exact: true }).click()

    await expect(window.getByRole('heading', { level: 1, name: 'Meghan Martin' })).toBeVisible()
    await expect(window.getByText('Asistencia', { exact: true })).toBeVisible()
    await expect(window.getByRole('heading', { name: 'Historial de asistencia' })).toBeVisible()
    const back = window.getByRole('button', { name: 'Volver a Hoy', exact: true })
    await expect(back).toBeVisible()
    await expect(back).toHaveText('Hoy')
    const fits = await back.evaluate((element) => element.scrollWidth <= element.clientWidth)
    expect(fits).toBe(true)
    await expectScreen(window, 'panel-ficha.png')
    await back.click()
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.getByRole('button', { name: /^Volver a/ })).toHaveCount(0)
  })
})

test('goes back to Estadísticas from a student file', async () => {
  await withPanel(async (window) => {
    // Las secciones de la barra lateral no tienen botón de volver.
    for (const [label, title] of [
      ['Dashboard', 'Hoy'],
      ['Sesiones', 'Sesiones'],
      ['Ajustes', 'Ajustes'],
      ['Estadísticas', 'Estadísticas']
    ]) {
      await openTab(window, label, title)
      await expect(window.getByRole('button', { name: /^Volver a/ }), title).toHaveCount(0)
    }
    await window
      .getByRole('region', { name: /^Asistencia por fecha/ })
      .getByRole('button', { name: 'Diego Torres', exact: true })
      .click()
    await expect(window.getByRole('heading', { level: 1, name: 'Diego Torres' })).toBeVisible()
    const back = window.getByRole('button', { name: 'Volver a Estadísticas', exact: true })
    await expect(back).toHaveText('Estadísticas')
    await back.click()
    await expect(window.getByRole('heading', { level: 1, name: 'Estadísticas' })).toBeVisible()
    await expect(
      window
        .getByRole('navigation', { name: 'Secciones' })
        .getByRole('button', { name: 'Estadísticas' })
    ).toHaveAttribute('aria-current', 'page')
    await expect(window.getByRole('button', { name: /^Volver a/ })).toHaveCount(0)
  })
})

// Compare against this branch's inherited tracking: #69 owns the global reset.
async function expectInheritedType(
  elements: Locator,
  tracking: string,
  family: string
): Promise<void> {
  expect(await elements.count()).toBeGreaterThan(0)
  for (const element of await elements.all()) {
    await expect(element).toHaveCSS('letter-spacing', tracking)
    await expect(element).toHaveCSS('font-family', family)
  }
}

async function expectCommonHeaders(window: Page, tracking: string): Promise<void> {
  const headers = window.locator('.teacher-panel .table:not(.attendance-table) th')
  expect(await headers.count()).toBeGreaterThan(0)
  const token = await window.locator('body').evaluate((body) => {
    const probe = document.createElement('span')
    probe.style.fontSize = 'var(--text-xs)'
    probe.style.lineHeight = 'var(--text-xs--line-height)'
    body.append(probe)
    const style = getComputedStyle(probe)
    const values = { size: style.fontSize, line: style.lineHeight }
    probe.remove()
    return values
  })
  for (const header of await headers.all()) {
    await expect(header).toHaveCSS('font-size', token.size)
    await expect(header).toHaveCSS('line-height', token.line)
    await expect(header).toHaveCSS('font-weight', '600')
    await expect(header).toHaveCSS('letter-spacing', tracking)
  }
}

for (const theme of ['atempo-oscuro', 'atempo-claro']) {
  test(`inherits the theme typography in headings, headers and body portals: ${theme}`, async ({
    browserName
  }, info) => {
    expect(browserName).toBe('chromium')
    await withPanel(async (window) => {
      await window
        .locator('html')
        .evaluate((html, value) => html.setAttribute('data-theme', value), theme)
      await window.evaluate(() => document.fonts.ready)
      const font = theme === 'atempo-oscuro' ? 'Geist' : 'Inter'
      const inherited = await window.locator('body').evaluate((body) => {
        const style = getComputedStyle(body)
        return { tracking: style.letterSpacing, family: style.fontFamily }
      })
      expect(inherited.family).toContain(font)
      for (const weight of [400, 500, 600]) {
        expect(
          await window.evaluate(
            async ({ font, weight }) => {
              const faces = await document.fonts.load(`${weight} 16px "${font}"`)
              return faces.length > 0 && faces.every((face) => face.status === 'loaded')
            },
            { font, weight }
          )
        ).toBe(true)
      }
      const headings = (): Locator => window.locator('.teacher-panel h1, .teacher-panel h2')
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      await expect(window.getByRole('heading', { level: 1 })).toHaveCSS('font-size', '20px')
      const brand = window.getByRole('button', { name: 'aTempo', exact: true })
      await expectInheritedType(brand, inherited.tracking, inherited.family)

      const risk = window
        .getByRole('row', { name: /Meghan Martin/ })
        .getByText('Puede faltar', { exact: true })
      await expectInheritedType(risk, inherited.tracking, inherited.family)
      await risk.hover()
      const riskTip = window
        .locator('body > .teacher-panel.tip')
        .filter({ hasText: 'Ha faltado 2 veces' })
      await expect(riskTip).toBeVisible()
      await expectInheritedType(
        riskTip.locator(':scope, :scope > span'),
        inherited.tracking,
        inherited.family
      )
      await window.screenshot({ path: info.outputPath('risk-hint.png'), animations: 'disabled' })
      await window.mouse.move(1439, 899)
      await expect(riskTip).toHaveCount(0)

      await window.getByRole('button', { name: 'Abrir lista', exact: true }).click()
      await expectCommonHeaders(window, inherited.tracking)
      const mark = window
        .getByRole('row', { name: /Diego Molero/ })
        .getByRole('button', { name: 'Pendiente' })
      await mark.click()
      const menu = window.locator('body > .teacher-panel[role="menu"]')
      await expect(menu).toBeVisible()
      await expectInheritedType(
        menu.locator(':scope, button, .badge'),
        inherited.tracking,
        inherited.family
      )
      await window.screenshot({
        path: info.outputPath('attendance-menu.png'),
        animations: 'disabled'
      })
      await menu.getByRole('button', { name: 'Ausente', exact: true }).click()
      const reason = window.getByRole('dialog', { name: /^Cambiar / })
      await reason.getByLabel('Motivo', { exact: true }).fill('Corrección en clase')
      await reason.getByRole('button', { name: 'Guardar', exact: true }).click()
      await expect(reason).toHaveCount(0)
      const absent = window
        .getByRole('row', { name: /Diego Molero/ })
        .getByRole('button', { name: 'Ausente' })
      await absent.hover()
      // La nota del estado va en un portal sin hueco con el estado: la tarjeta es su span interior.
      const absenceTip = window
        .locator('body > .teacher-panel[role="tooltip"]')
        .filter({ hasText: 'Sin justificante' })
      await expect(absenceTip).toBeVisible()
      await expectInheritedType(
        absenceTip.locator(':scope, .tip, .tip > span'),
        inherited.tracking,
        inherited.family
      )
      await window.screenshot({ path: info.outputPath('absence-note.png'), animations: 'disabled' })
      await window.mouse.move(1439, 899)
      await expect(absenceTip).toHaveCount(0)

      await openTab(window, 'Sesiones', 'Sesiones')
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      await expectCommonHeaders(window, inherited.tracking)
      await window.getByRole('button', { name: 'Mar 10 nov 2026', exact: true }).click()
      await expectCommonHeaders(window, inherited.tracking)
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      await openTab(window, 'Estadísticas', 'Estadísticas')
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      // The attendance grid deliberately keeps tracking-normal for compact date labels.
      await expect(window.locator('.attendance-grid .tracking-normal').first()).toHaveCSS(
        'letter-spacing',
        /^(normal|0px)$/
      )
      await openTab(window, 'Ajustes', 'Ajustes')
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      await expect(window.locator('html')).toHaveAttribute('data-theme', theme)
      await openTab(window, 'Dashboard', 'Hoy')
      await window.getByRole('button', { name: 'Meghan Martin', exact: true }).click()
      await expect(window.getByRole('heading', { level: 1, name: 'Meghan Martin' })).toBeVisible()
      await expectInheritedType(headings(), inherited.tracking, inherited.family)
      const back = window.getByRole('button', { name: 'Volver a Hoy', exact: true })
      expect(await back.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
      await window.screenshot({ path: info.outputPath('student-file.png'), animations: 'disabled' })
    })
  })

  test(`keeps the mobile panel typography and summary: ${theme}`, async ({ browserName }, info) => {
    expect(browserName).toBe('chromium')
    await withPanel(
      async (window) => {
        await window
          .locator('html')
          .evaluate((html, value) => html.setAttribute('data-theme', value), theme)
        await window.evaluate(() => document.fonts.ready)
        const inherited = await window.locator('body').evaluate((body) => {
          const style = getComputedStyle(body)
          return { tracking: style.letterSpacing, family: style.fontFamily }
        })
        await expectInheritedType(
          window.locator('.teacher-panel h1, .teacher-panel h2'),
          inherited.tracking,
          inherited.family
        )
        await window.screenshot({
          path: info.outputPath('mobile-today.png'),
          animations: 'disabled'
        })
        await openTab(window, 'Estadísticas', 'Estadísticas')
        await expect(window.getByRole('region', { name: 'Asistencia por alumno' })).toBeVisible()
        await expectInheritedType(
          window.locator('.teacher-panel h1, .teacher-panel h2'),
          inherited.tracking,
          inherited.family
        )
        await window.screenshot({
          path: info.outputPath('mobile-statistics.png'),
          animations: 'disabled'
        })
      },
      { width: 390, height: 844 }
    )
  })
}

test('keeps the available inherited typography without an explicit theme', async () => {
  await withPanel(async (window) => {
    await window.locator('html').evaluate((html) => html.removeAttribute('data-theme'))
    const inherited = await window.locator('body').evaluate((body) => {
      const style = getComputedStyle(body)
      return { tracking: style.letterSpacing, family: style.fontFamily }
    })
    await expectInheritedType(
      window.locator('.teacher-panel h1, .teacher-panel h2'),
      inherited.tracking,
      inherited.family
    )
  })
})
