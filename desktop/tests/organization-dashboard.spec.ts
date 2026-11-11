import { _electron as electron, expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  organizationExample,
  incompleteOrganizationExample
} from '../src/renderer/src/organization/organizationExample'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out/main/index.js')
const fixtureFile = path.join(
  appRoot,
  'test-results/dashboard-fixture/tests/fixtures/dashboard.html'
)

test.beforeAll(() => {
  execFileSync(process.execPath, [path.join(__dirname, 'fixtures/build-dashboard.mjs')], {
    cwd: appRoot,
    stdio: 'pipe'
  })
})

async function withDashboard(
  run: (window: Page) => Promise<void>,
  state?: 'empty' | 'incomplete'
): Promise<void> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', mainFile],
    cwd: appRoot
  })
  try {
    const window = await app.firstWindow()
    await window.setViewportSize({ width: 1280, height: 900 })
    if (state) {
      const fixture = pathToFileURL(fixtureFile)
      fixture.searchParams.set('state', state)
      await window.goto(fixture.href)
    } else {
      await window.getByLabel('Correo').fill('ana@clase.test')
      await window.getByLabel('Contraseña').fill('secreta')
      await window.getByRole('button', { name: 'Entrar' }).click()
    }
    await expect(window.getByRole('heading', { name: 'Resumen', level: 1 })).toBeVisible()
    await window.evaluate(() => document.fonts.ready)
    await run(window)
  } finally {
    await app.close()
  }
}

async function expectNoPageOverflow(window: Page): Promise<void> {
  const sizes = await window.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  }))
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
}

test('counts each review student once and explains both thresholds', async () => {
  await withDashboard(async (window) => {
    const summary = window.getByRole('region', { name: 'Estudiantes a revisar', exact: true })
    const students = window.getByRole('region', { name: 'Estudiantes a acompañar' })
    const ids = organizationExample.students.map((student) => student.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(organizationExample.reviewStudentCount).toBe(new Set(ids).size)
    await expect(summary.locator('.stat-value')).toHaveText(String(ids.length))
    await expect(students.getByRole('heading', { level: 3 })).toHaveCount(ids.length)
    await expect(summary).toContainText('Al menos 3 no justificadas en las últimas 5 sesiones.')
    await expect(summary).toContainText('Al menos 4 en las últimas 6 sesiones.')
    await expect(summary).toContainText('Cada estudiante cuenta una sola vez.')
    await expect(summary).not.toContainText('%')
    await expect(students.getByRole('heading', { name: 'Sofía García' })).toHaveCount(1)
    const bothPatterns = students.locator('li').filter({
      has: window.getByRole('heading', { name: 'Sofía García' })
    })
    await expect(bothPatterns).toContainText('3 ausencias en 5 sesiones')
    await expect(bothPatterns).toContainText('4 retrasos en 6 sesiones')
    await expect(window.locator('body')).not.toContainText(/salida|NaN|Infinity/i)
    await expect(
      window.getByText('Vista informativa. Los avisos no aplican sanciones.')
    ).toBeVisible()
  })
})

test('shows administrative context, coherent course metrics and inactive navigation', async () => {
  await withDashboard(async (window) => {
    await expect(window.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(window.locator('header')).toContainText('Academia Horizonte')
    await expect(window.locator('header')).toContainText('1–30 de noviembre de 2026')
    await expect(window.locator('header')).toContainText('María Torres')
    const navigation = window.getByRole('navigation', { name: 'Administración de la organización' })
    await expect(navigation.locator('[aria-current="page"]')).toHaveText('Resumen')
    await expect(navigation.getByText('Próximamente', { exact: true })).toHaveCount(5)
    for (const area of [
      'Cursos y calendario',
      'Alumnos',
      'Profesores',
      'Juegos',
      'Configuraci\u00f3n'
    ]) {
      await expect(navigation.getByText(area, { exact: true })).toBeVisible()
    }
    await expect(window.getByRole('button')).toHaveCount(0)
    await expect(window.getByRole('link')).toHaveCount(0)
    const table = window.getByRole('table')
    await expect(table.getByRole('columnheader')).toHaveText(['Curso', 'Ausencias', 'Retrasos'])
    for (const course of organizationExample.courses) {
      const row = table.getByRole('row').filter({ hasText: course.name })
      for (const metric of [course.absences, course.delays]) {
        const percentage = Number(metric.percentage?.replace('%', '').replace(',', '.').trim())
        expect(percentage).toBeCloseTo((metric.count! / metric.base!) * 100, 1)
        await expect(row).toContainText(`${metric.count} de ${metric.base}`)
        await expect(row).toContainText(metric.percentage!)
      }
      await expect(row).toContainText(`${course.justifiedAbsences} justificadas`)
    }
    const pending = window.getByRole('region', { name: 'Pendientes de la organización' })
    await expect(pending).toContainText('Justificantes')
    await expect(pending).toContainText('Correcciones')
    await expect(pending).toContainText('Sesiones sin cerrar')
    const quality = window.getByRole('region', { name: 'Calidad de los datos' })
    await expect(window.getByRole('alert')).toHaveText(
      'Los resultados pueden cambiar: hay justificantes y correcciones pendientes.'
    )
    await expect(window.locator('body')).not.toContainText(
      /Provisional|Dashboard|Settings|Se\u00f1ales para acompa\u00f1ar a tus estudiantes/
    )
    await expect(quality).toContainText('Las 2 sesiones abiertas no entran en las métricas.')
  })
})

test('shows an explicit empty state with zero students', async () => {
  await withDashboard(async (window) => {
    await expect(window.locator('.stat-value')).toHaveText('0')
    await expect(window.locator('header')).not.toContainText('Avisos pendientes')
    await expect(window.getByText('No hay estudiantes a revisar en este periodo.')).toBeVisible()
    await expect(window.getByText('Sin datos de cursos en este periodo.')).toBeVisible()
    await expect(
      window.getByText('Sin sesiones cerradas en este periodo.', { exact: false })
    ).toBeVisible()
    await expect(window.getByText('Provisional', { exact: true })).toHaveCount(0)
    await expectNoPageOverflow(window)
  }, 'empty')
})

test('shows unknown and zero bases as missing data without invalid ratios', async () => {
  await withDashboard(async (window) => {
    await expect(window.getByRole('table').getByText('Sin datos', { exact: true })).toHaveCount(2)
    await expect(window.getByRole('alert')).toHaveCount(1)
    await expect(window.getByRole('region', { name: 'Calidad de los datos' })).toContainText(
      'Faltan registros para completar las m\u00e9tricas del curso.'
    )
    await expect(window.locator('body')).not.toContainText(/NaN|Infinity|null|undefined/)
    await expect(window.getByRole('table')).not.toContainText('%')
  }, 'incomplete')
})

for (const state of [undefined, 'empty', 'incomplete'] as const) {
  for (const theme of ['atempo-oscuro', 'atempo-claro']) {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 }
    ]) {
      test(`preserves ${state ?? 'normal'} layout in ${theme} at ${viewport.width} pixels`, async () => {
        await withDashboard(async (window) => {
          await window.setViewportSize(viewport)
          await window.evaluate(
            (name) => document.documentElement.setAttribute('data-theme', name),
            theme
          )
          await window.evaluate(() => document.fonts.ready)
          await expectNoPageOverflow(window)
          const nav = window.getByRole('navigation')
          await expect(nav.locator('[aria-current="page"]')).toHaveText('Resumen')
          for (const area of [
            'Cursos y calendario',
            'Alumnos',
            'Profesores',
            'Juegos',
            'Configuraci\u00f3n'
          ]) {
            await expect(nav.getByText(area, { exact: true })).toBeVisible()
          }
          await expect(nav.getByRole('link')).toHaveCount(0)
          await expect(nav.getByRole('button')).toHaveCount(0)
          await expect(window.locator('body')).not.toContainText(
            /Dashboard|Settings|Provisional|Se\u00f1ales para acompa\u00f1ar a tus estudiantes|NaN|Infinity|null|undefined/
          )
          await expect(window.getByRole('alert')).toHaveCount(state === 'empty' ? 0 : 1)
          if (state !== 'empty') {
            await expect(window.getByRole('alert')).toHaveText(
              'Los resultados pueden cambiar: hay justificantes y correcciones pendientes.'
            )
            const model =
              state === 'incomplete' ? incompleteOrganizationExample : organizationExample
            for (const course of model.courses) {
              const row = window
                .getByRole('table')
                .getByRole('row')
                .filter({ hasText: course.name })
              await expect(
                row.getByText('Datos pendientes de confirmar', { exact: true })
              ).toHaveCount(course.provisional ? 1 : 0)
            }
            for (const student of model.students) {
              const row = window
                .getByRole('region', { name: 'Estudiantes a acompa\u00f1ar' })
                .locator('li')
                .filter({ has: window.getByRole('heading', { name: student.name, exact: true }) })
              await expect(
                row.getByText('Datos pendientes de confirmar', { exact: true })
              ).toHaveCount(student.provisional ? 1 : 0)
            }
          } else {
            await expect(window.locator('.stat-value')).toHaveText('0')
            await expect(window.getByText('Sin datos de cursos en este periodo.')).toBeVisible()
          }
          if (state === 'incomplete') {
            await expect(
              window.getByRole('table').getByText('Sin datos', { exact: true })
            ).toHaveCount(2)
            await expect(window.getByRole('table')).not.toContainText('%')
          }
          const navigation = await window.getByRole('navigation').boundingBox()
          const summary = await window
            .getByRole('region', { name: 'Estudiantes a revisar', exact: true })
            .boundingBox()
          const courses = await window
            .getByRole('region', { name: 'Asistencia por curso' })
            .boundingBox()
          const students = await window
            .getByRole('region', { name: 'Estudiantes a acompañar' })
            .boundingBox()
          expect(navigation).not.toBeNull()
          expect(summary).not.toBeNull()
          if (viewport.width === 390) {
            test.info().annotations.push({
              type: 'navigation-height',
              description: `${navigation!.height}px; aside ${(await window.locator('aside').boundingBox())!.height}px`
            })
            expect(navigation!.height).toBeLessThan(180.53125)
            expect((await window.locator('aside').boundingBox())!.height).toBeLessThan(280.53125)
            expect(navigation!.y + navigation!.height).toBeLessThanOrEqual(summary!.y)
            expect(courses!.y + courses!.height).toBeLessThanOrEqual(students!.y)
          } else {
            expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(summary!.x)
            expect(courses!.x + courses!.width).toBeLessThanOrEqual(students!.x)
          }
          if (theme === 'atempo-claro') {
            expect(
              await window.locator('body').evaluate((body) => getComputedStyle(body).fontFamily)
            ).toContain('Inter')
          }
          await expect(window).toHaveScreenshot(
            `dashboard-${state ?? 'normal'}-${theme}-${viewport.width}.png`,
            {
              fullPage: true,
              animations: 'disabled'
            }
          )
        }, state)
      })
    }
  }
}
