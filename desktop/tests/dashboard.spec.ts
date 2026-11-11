import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import path from 'node:path'

const appRoot = path.join(__dirname, '..')
const mainFile = path.join(appRoot, 'out', 'main', 'index.js')

const dashboardButtonIds = [
  'registrar-asistencia',
  'proxima-clase',
  'avisar-retrasos-ausencias',
  'resumen-asistencia'
] as const

async function openDashboardApp(): Promise<{ app: ElectronApplication; window: Page }> {
  const app = await electron.launch({
    args: ['--force-device-scale-factor=1', '--dashboard', mainFile],
    cwd: appRoot
  })
  const window = await app.firstWindow()
  await window.setViewportSize({ width: 960, height: 720 })
  await window.evaluate(() => document.fonts.ready)
  return { app, window }
}

async function withDashboardApp(run: (window: Page) => Promise<void>): Promise<void> {
  const { app, window } = await openDashboardApp()
  try {
    await run(window)
  } finally {
    await app.close()
  }
}

test('shows the student dashboard mockup', async () => {
  await withDashboardApp(async (window) => {
    await expect(
      window.getByRole('heading', { name: 'Dashboard alumno', level: 1 })
    ).toBeVisible()
    await expect(window.getByText('Bienvenido Ada López')).toBeVisible()

    for (const id of dashboardButtonIds) {
      await expect(window.locator(`#${id}`)).toBeVisible()
    }

    await expect(window).toHaveScreenshot('dashboard-empty.png', { animations: 'disabled' })
  })
})
