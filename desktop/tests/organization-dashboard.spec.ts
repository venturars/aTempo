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

const futureAreas = ['Cursos y calendario', 'Alumnos', 'Profesores', 'Juegos', 'Configuración']
const reviewStudents = ['Ana López', 'Diego Martín', 'Sofía García', 'Lucas Pérez']
const pendingNotice = 'Los resultados pueden cambiar: hay justificantes y correcciones pendientes.'
const pendingLabel = 'Datos pendientes de confirmar'
const themes = ['atempo-oscuro', 'atempo-claro']
const viewports = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 }
]

type Box = {
  x: number
  y: number
  width: number
  height: number
}

async function openApp(startupArgs: string[]): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile, ...startupArgs],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 1280, height: 900 })
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

async function withApp(
  run: (window: Page) => Promise<void>,
  startupArgs: string[] = ['--organization-dashboard']
): Promise<void> {
  const { app, window } = await openApp(startupArgs)
  try {
    await run(window)
  } finally {
    await app.close()
  }
}

async function readHash(window: Page): Promise<string> {
  const hash = await window.evaluate(() => window.location.hash)
  return hash.replace(/^#\/?/, '')
}

async function readBox(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (box === null) {
    throw new Error('El elemento no tiene recuadro.')
  }
  return box
}

function navigation(window: Page): Locator {
  return window.getByRole('navigation', { name: 'Administración de la organización' })
}

function reviewSummary(window: Page): Locator {
  return window.getByRole('region', { name: 'Estudiantes a revisar', exact: true })
}

function courseTable(window: Page): Locator {
  return window.getByRole('region', { name: 'Asistencia por curso' })
}

function studentList(window: Page): Locator {
  return window.getByRole('region', { name: 'Estudiantes a acompañar' })
}

async function expectSummaryHeading(window: Page): Promise<void> {
  await expect(window.getByRole('heading', { name: 'Resumen', level: 1 })).toBeVisible()
}

async function expectNoPageOverflow(window: Page): Promise<void> {
  const sizes = await window.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }))
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
}

async function expectInactiveNavigation(window: Page): Promise<void> {
  const nav = navigation(window)
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Resumen')
  for (const area of futureAreas) {
    await expect(nav.getByText(area, { exact: true })).toBeVisible()
  }
  await expect(nav.getByText('Próximamente', { exact: true })).toHaveCount(5)
  await expect(nav.getByRole('link')).toHaveCount(0)
  await expect(nav.getByRole('button')).toHaveCount(0)
}

async function expectNoInvalidText(window: Page): Promise<void> {
  await expect(window.locator('body')).not.toContainText(
    /Provisional|Dashboard|Settings|NaN|Infinity|undefined|null/
  )
}

test('shows the organization context and the inactive navigation', async () => {
  await withApp(async (window) => {
    expect(await readHash(window)).toBe('organization/dashboard')
    await expectSummaryHeading(window)
    await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(window.locator('header')).toContainText('Academia Horizonte')
    await expect(window.locator('header')).toContainText('1–30 de noviembre de 2026')
    await expect(window.locator('header')).toContainText('María Torres')
    await expectInactiveNavigation(window)
    await expect(window.getByRole('button')).toHaveCount(0)
    await expect(window.getByRole('link')).toHaveCount(0)
    await expect(
      window.getByText('Vista informativa. Los avisos no aplican sanciones.')
    ).toBeVisible()
    await expectNoInvalidText(window)
  })
})

test('counts each review student once and explains both thresholds', async () => {
  await withApp(async (window) => {
    const summary = reviewSummary(window)
    await expect(summary.locator('.stat-value')).toHaveText('4')
    await expect(studentList(window).getByRole('heading', { level: 3 })).toHaveText(reviewStudents)
    await expect(summary).toContainText('Al menos 3 no justificadas en las últimas 5 sesiones.')
    await expect(summary).toContainText('Al menos 4 en las últimas 6 sesiones.')
    await expect(summary).toContainText('Cada estudiante cuenta una sola vez.')
    await expect(summary).not.toContainText('%')

    const bothPatterns = studentList(window)
      .locator('li')
      .filter({
        has: window.getByRole('heading', { name: 'Sofía García' })
      })
    await expect(bothPatterns).toContainText('3 ausencias en 5 sesiones')
    await expect(bothPatterns).toContainText('4 retrasos en 6 sesiones')
  })
})

test('shows the course metrics, the pending items and the data quality', async () => {
  await withApp(async (window) => {
    const table = courseTable(window).getByRole('table')
    await expect(table.getByRole('columnheader')).toHaveText(['Curso', 'Ausencias', 'Retrasos'])

    const english = table.getByRole('row').filter({ hasText: 'Inglés · B1' })
    await expect(english).toContainText('18 de 200')
    await expect(english).toContainText('9 %')
    await expect(english).toContainText('14 de 182')
    await expect(english).toContainText('7,7 %')
    await expect(english).toContainText('5 justificadas')

    const french = table.getByRole('row').filter({ hasText: 'Francés · A2' })
    await expect(french).toContainText('12 de 150')
    await expect(french).toContainText('8 %')
    await expect(french).toContainText('9 de 138')
    await expect(french).toContainText('6,5 %')
    await expect(french).toContainText('4 justificadas')

    const pending = window.getByRole('region', { name: 'Pendientes de la organización' })
    await expect(pending).toContainText('Justificantes')
    await expect(pending).toContainText('Correcciones')
    await expect(pending).toContainText('Sesiones sin cerrar')

    const quality = window.getByRole('region', { name: 'Calidad de los datos' })
    await expect(quality).toContainText('Las 2 sesiones abiertas no entran en las métricas.')

    await expect(window.getByRole('alert')).toHaveText(pendingNotice)
    await expect(window.getByText(pendingLabel, { exact: true })).toHaveCount(4)
  })
})

for (const theme of themes) {
  for (const viewport of viewports) {
    test(`preserves the layout in ${theme} at ${viewport.width} pixels`, async () => {
      await withApp(async (window) => {
        await window.setViewportSize(viewport)
        await window.evaluate(
          (name) => document.documentElement.setAttribute('data-theme', name),
          theme
        )
        await window.evaluate(() => document.fonts.ready)

        await expectSummaryHeading(window)
        await expectNoPageOverflow(window)
        await expectInactiveNavigation(window)
        await expect(window.getByRole('alert')).toHaveText(pendingNotice)
        await expectNoInvalidText(window)

        const navigationBox = await readBox(navigation(window))
        const summaryBox = await readBox(reviewSummary(window))
        const coursesBox = await readBox(courseTable(window))
        const studentsBox = await readBox(studentList(window))

        if (viewport.width === 390) {
          expect(navigationBox.y + navigationBox.height).toBeLessThanOrEqual(summaryBox.y)
          expect(coursesBox.y + coursesBox.height).toBeLessThanOrEqual(studentsBox.y)
        } else {
          expect(navigationBox.x + navigationBox.width).toBeLessThanOrEqual(summaryBox.x)
          expect(coursesBox.x + coursesBox.width).toBeLessThanOrEqual(studentsBox.x)
        }

        await expect(window).toHaveScreenshot(`dashboard-normal-${theme}-${viewport.width}.png`, {
          fullPage: true,
          animations: 'disabled'
        })
      })
    })
  }
}
