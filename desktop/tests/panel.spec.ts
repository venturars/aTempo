import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Locator,
  type Page
} from '@playwright/test'
import path from 'node:path'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

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

test.describe.configure({ timeout: 60_000 })

async function openPanel(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 1440, height: 900 })
  await window.getByLabel('Correo').fill('ana@clase.test')
  await window.getByLabel('Contraseña').fill('secreta')
  await window.getByRole('button', { name: 'Entrar' }).click()
  await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
  return { app, window }
}

async function withPanel(run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openPanel()
  try {
    await run(window)
  } finally {
    await app.close()
  }
}

async function withApp(
  flags: string[],
  size: { width: number; height: number },
  run: (window: Page) => Promise<void>
): Promise<void> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', ...flags, mainFile],
    cwd: appRoot
  })
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
  await expect(window).toHaveScreenshot(name, { animations: 'disabled' })
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

test('la sesión cancelada se ve en Sesiones y no abre el pase de lista', async () => {
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

test('la cuadrícula muestra la cancelada y no cuenta para el porcentaje ni los reconocimientos', async () => {
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

test('las pistas de riesgo siguen con Mar 10, Lun 9, Vie 6 y Jue 5', async () => {
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

test('los quince alumnos se desplazan dentro de la tarjeta y la cabecera sigue visible', async () => {
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

test('un login válido lleva a #/teacher/panel', async () => {
  await withApp([], { width: 1440, height: 900 }, async (window) => {
    expect(await window.evaluate(() => window.location.hash)).toBe('')
    await window.getByLabel('Correo').fill('ana@clase.test')
    await window.getByLabel('Contraseña').fill('secreta')
    await window.getByRole('button', { name: 'Entrar' }).click()

    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    expect(await window.evaluate(() => window.location.hash)).toBe('#/teacher/panel')
  })
})

test('--panel abre el panel al arrancar', async () => {
  await withApp(['--panel'], { width: 1440, height: 900 }, async (window) => {
    const hash = await window.evaluate(() => window.location.hash)
    expect(hash.replace(/^#\/?/, '')).toBe('teacher/panel')
    await expect(window.getByRole('heading', { level: 1, name: 'Hoy' })).toBeVisible()
    await expect(window.getByLabel('Correo')).toHaveCount(0)
    await expect(window.getByRole('button', { name: 'Entrar' })).toHaveCount(0)
  })
})

test('las pantallas del panel en escritorio coinciden con sus capturas', async () => {
  await withApp(['--panel'], { width: 1440, height: 900 }, async (window) => {
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

test('Estadísticas a 390 px coincide con su captura', async () => {
  await withApp(['--panel'], { width: 390, height: 844 }, async (window) => {
    await openTab(window, 'Estadísticas', 'Estadísticas')
    const summary = window.getByRole('region', { name: 'Asistencia por alumno' })
    await expect(summary).toBeVisible()
    await expect(window.getByRole('region', { name: /^Asistencia por fecha/ })).toBeHidden()
    await expectScreen(window, 'panel-estadisticas-movil.png')
  })
})
