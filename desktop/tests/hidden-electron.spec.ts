import { expect, test } from '@playwright/test'
import { assertHidden, launchHiddenElectron } from './helpers/electron'

test('real build renders and accepts input without native visibility or focus', async () => {
  test.setTimeout(30000)
  const app = await launchHiddenElectron()
  try {
    const page = await app.firstWindow()
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await page.getByLabel('Correo').fill('hidden@clase.test')
    await page.getByLabel('Contraseña').fill('secreta12')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText('El correo o la contraseña no coinciden.')
    await expect(page.getByRole('status')).toHaveCount(0)
    const text = await page.locator('body').innerText()
    expect(text).not.toContain('hidden@clase.test')
    expect(text).not.toContain('secreta12')
    await page.getByLabel('Correo').focus()
    await expect(page.getByLabel('Correo')).toBeFocused()
    await page.keyboard.press('End')
    await page.keyboard.type('.es')
    await expect(page.getByLabel('Correo')).toHaveValue('hidden@clase.test.es')
    await page.evaluate(() => {
      window.location.hash = '#/student/dashboard'
    })
    await expect(page.getByRole('heading', { name: 'Dashboard alumno', level: 1 })).toBeVisible()
    const screenshot = await page.screenshot({ path: test.info().outputPath('hidden-smoke.png') })
    expect(screenshot.length).toBeGreaterThan(10000)
    const audit = await app.evaluate(({ BrowserWindow, app }) => {
      const window = BrowserWindow.getAllWindows()[0]
      window.show()
      window.showInactive()
      window.focus()
      app.focus()
      return (
        globalThis as unknown as {
          __hiddenElectronAudit: { attempts: string[]; violations: string[]; windows: number }
        }
      ).__hiddenElectronAudit
    })
    expect(audit.attempts).toEqual(expect.arrayContaining(['show', 'showInactive', 'focus']))
    expect(audit.violations).toEqual([])
    await assertHidden(app)
    console.log(
      `Hidden smoke audit: ${JSON.stringify(audit)}; screenshot bytes=${screenshot.length}`
    )
  } finally {
    await app.close()
  }
})
