import { _electron as electron, expect, test, type Locator, type Page } from '@playwright/test'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'

const appRoot = path.join(__dirname, '..')
const storybookRoot = path.join(appRoot, '..', 'docs', 'storybook')
const storybookUrl = 'http://127.0.0.1:6006'
const themes = ['atempo-oscuro', 'atempo-claro'] as const
let server: ChildProcess

// This suite owns its loopback-only preview server and closes it even after failures.
test.beforeAll(async () => {
  server = spawn(
    process.execPath,
    [
      path.join(storybookRoot, 'node_modules/vite/bin/vite.js'),
      'preview',
      '--outDir',
      'storybook-static',
      '--host',
      '127.0.0.1',
      '--port',
      '6006',
      '--strictPort'
    ],
    { cwd: storybookRoot, stdio: 'ignore' }
  )
  await expect
    .poll(async () => {
      if (server.exitCode !== null)
        throw new Error('Storybook preview stopped before becoming ready')
      return fetch(`${storybookUrl}/index.json`)
        .then((response) => response.ok)
        .catch(() => false)
    })
    .toBe(true)
})
test.afterAll(async () => {
  if (server && server.exitCode === null) {
    const stopped = new Promise<void>((resolve) => server.once('exit', () => resolve()))
    server.kill('SIGTERM')
    await stopped
  }
})
async function story(page: Page, id: string, theme: string): Promise<void> {
  await page.goto(`${storybookUrl}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await expect(page.locator('#storybook-root > *')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  await page.evaluate(() => document.fonts.ready)
}
async function withApp(run: (page: Page) => Promise<void>): Promise<void> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', path.join(appRoot, 'out/main/index.js')],
    cwd: appRoot
  })
  try {
    const page = await app.firstWindow()
    await page.evaluate(() => document.fonts.ready)
    await run(page)
  } finally {
    await app.close()
  }
}
async function setTheme(page: Page, theme: string | null): Promise<void> {
  await page.evaluate((value) => {
    if (value === null) document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', value)
  }, theme)
  await page.evaluate(() => document.fonts.ready)
}
async function foundations(page: Page): Promise<unknown> {
  return page.locator('body').evaluate((body) => {
    const style = getComputedStyle(body)
    const colors = [
      'base-100',
      'base-200',
      'base-300',
      'base-content',
      'primary',
      'primary-content',
      'secondary',
      'secondary-content',
      'accent',
      'accent-content',
      'neutral',
      'neutral-content',
      'info',
      'info-content',
      'success',
      'success-content',
      'warning',
      'warning-content',
      'error',
      'error-content'
    ]
    return {
      colors: Object.fromEntries(
        colors.map((name) => [name, style.getPropertyValue(`--color-${name}`).trim()])
      ),
      fontFamily: style.fontFamily,
      background: style.backgroundColor,
      color: style.color,
      letterSpacing: style.letterSpacing,
      colorScheme: style.colorScheme
    }
  })
}
async function expectLoadedFont(page: Page, font: string): Promise<void> {
  await expect(page.locator('body')).toHaveCSS('font-family', new RegExp(font))
  for (const weight of [400, 500, 600]) {
    expect(
      await page.evaluate(
        async ({ font, weight }) => {
          const faces = await document.fonts.load(`${weight} 16px "${font}"`)
          return faces.length > 0 && faces.every((face) => face.status === 'loaded')
        },
        { font, weight }
      )
    ).toBe(true)
  }
}
async function expectFocus(control: Locator): Promise<void> {
  await control.focus()
  await expect(control).toBeFocused()
  await expect(control).toHaveCSS('outline-style', 'solid')
  await expect(control).toHaveCSS('outline-width', '2px')
  await expect(control).not.toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)')
}
for (const theme of themes) {
  test(`fundamentos coinciden en ambos consumidores: ${theme}`, async ({ page }) => {
    await story(page, 'fundamentos-tema--gallery', theme)
    const expected = await foundations(page)
    const font = theme === 'atempo-oscuro' ? 'Geist' : 'Inter'
    await expectLoadedFont(page, font)
    for (const [size, pixels] of [
      ['2xl', 28],
      ['xl', 20],
      ['lg', 18],
      ['base', 16],
      ['sm', 14],
      ['meta', 13],
      ['xs', 11]
    ] as const) {
      await expect(page.getByText(`text-${size} · ${pixels}`, { exact: true })).toHaveCSS(
        'font-size',
        `${pixels}px`
      )
    }
    await withApp(async (window) => {
      await setTheme(window, theme)
      expect(await foundations(window)).toEqual(expected)
      await expectLoadedFont(window, font)
      await expect(window.locator('body')).toHaveCSS('letter-spacing', 'normal')
      await expect(window.locator('h1')).toHaveCSS('font-size', '28px')
      await expect(window.locator('h1')).toHaveCSS('font-weight', '500')
      // Compare layout distances against the rendered spacing ruler.
      const step = (await page.locator('#storybook-root .w-8').first().boundingBox())!.width
      await expect(window.locator('main')).toHaveCSS('gap', `${step}px`)
      await expect(window.locator('main')).toHaveCSS('padding', `${step}px`)
      await window.getByRole('button', { name: 'Entrar', exact: true }).click()
      await expect(window.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true')
      await story(page, 'entrada-input--gallery', theme)
      const readError = (input: Element): { shadow: string; background: string } => {
        const style = getComputedStyle(input)
        return { shadow: style.boxShadow, background: style.backgroundColor }
      }
      const errorStyle = await page.getByLabel('Correo', { exact: true }).evaluate(readError)
      expect(await window.getByLabel('Correo').evaluate(readError)).toEqual(errorStyle)
      expect(errorStyle.shadow).not.toBe('none')
      await expectFocus(window.getByLabel('Correo'))
    })
  })
  test(`historias compartidas conservan estados y controles: ${theme}`, async ({
    browser,
    page
  }) => {
    // Inventory of shared daisyUI components present in the five current screens.
    for (const [id, selector] of [
      ['acciones-button', '.btn'],
      ['entrada-input', '.input'],
      ['aviso-alert', '.alert'],
      ['datos-card', '.card'],
      ['datos-badge', '.badge'],
      ['datos-stat', '.stat'],
      ['datos-table', '.table']
    ]) {
      await story(page, `${id}--gallery`, theme)
      await expect(page.locator(`#storybook-root ${selector}`).first()).toBeVisible()
      await expect(page.locator(`#storybook-root ${selector}`).first()).toHaveCSS(
        'letter-spacing',
        'normal'
      )
    }
    await expect.soft(page.locator('#storybook-root th').first()).toHaveCSS('font-size', '11px')
    await expect.soft(page.locator('#storybook-root td').first()).toHaveCSS('height', '56px')
    await story(page, 'acciones-button--gallery', theme)
    await expect(page.getByRole('button', { name: 'Desactivado', exact: true })).toBeDisabled()
    await expectFocus(page.getByRole('button', { name: 'Guardar', exact: true }))
    await story(page, 'entrada-input--gallery', theme)
    await expect(page.getByLabel('Correo', { exact: true })).toHaveAttribute('aria-invalid', 'true')
    await expectFocus(page.getByLabel('Neutro', { exact: true }))
    const context = await browser.newContext({ hasTouch: true, isMobile: true })
    try {
      const touch = await context.newPage()
      expect(await touch.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)
      for (const [id, selector] of [
        ['acciones-button', '.btn:not(.btn-xs,.btn-lg,.btn-xl)'],
        ['entrada-input', '.input:not(.input-xs,.input-lg,.input-xl)'],
        ['entrada-select', '.select:not(.select-xs,.select-lg,.select-xl)']
      ]) {
        await story(touch, `${id}--gallery`, theme)
        const heights = await touch
          .locator(selector)
          .evaluateAll((controls) =>
            controls.map((control) => control.getBoundingClientRect().height)
          )
        expect(heights.length).toBeGreaterThan(0)
        for (const height of heights) expect(height).toBeGreaterThanOrEqual(44)
      }
    } finally {
      await context.close()
    }
  })
}
for (const preference of ['light', 'dark'] as const) {
  test(`tema implícito conserva oscuro con preferencia ${preference}`, async ({ page }) => {
    await story(page, 'fundamentos-tema--gallery', 'atempo-oscuro')
    const dark = await foundations(page)
    await withApp(async (window) => {
      for (const consumer of [page, window]) {
        await consumer.emulateMedia({ colorScheme: preference })
        await setTheme(consumer, null)
        expect(await foundations(consumer)).toEqual(dark)
        await expectLoadedFont(consumer, 'Geist')
        await setTheme(consumer, 'atempo-claro')
        await expectLoadedFont(consumer, 'Inter')
        await expect(consumer.locator('body')).toHaveCSS('color-scheme', 'light')
      }
      expect(await foundations(window)).toEqual(await foundations(page))
    })
  })
}
const routes = ['', 'sign-up', 'student/dashboard', 'organization/dashboard', 'teacher/panel']
for (const theme of themes) {
  for (const width of [390, 1280]) {
    test(`cinco rutas conservan sistema y ancho: ${theme} ${width}`, async ({
      browserName
    }, info) => {
      test.skip(browserName !== 'chromium', 'Electron uses Chromium')
      await withApp(async (page) => {
        await page.setViewportSize({ width, height: 900 })
        await setTheme(page, theme)
        for (const route of routes) {
          await page.evaluate((route) => {
            location.hash = `#/${route}`
          }, route)
          if (route === '' || route === 'sign-up') {
            await expect(
              page.getByRole('button', {
                name: route === '' ? 'Entrar' : 'Crear mi cuenta',
                exact: true
              })
            ).toBeVisible()
          } else {
            const title =
              route === 'student/dashboard'
                ? 'Dashboard alumno'
                : route === 'organization/dashboard'
                  ? 'Resumen'
                  : 'Panel del profesor'
            await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
          }
          await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#/${route}`)
          await expectLoadedFont(page, theme === 'atempo-oscuro' ? 'Geist' : 'Inter')
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
            )
          ).toBe(true)
          const tracking = await page
            .locator('h1, th, .btn, .input')
            .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).letterSpacing))
          expect(tracking.every((value) => value === 'normal' || value === '0px')).toBe(true)
          await page.screenshot({
            path: info.outputPath(`${route.replaceAll('/', '-') || 'login'}.png`),
            fullPage: true,
            animations: 'disabled'
          })
        }
      })
    })
  }
}
