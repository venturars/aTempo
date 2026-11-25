import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: /(admin-(store|web)|web-invite|web-auth0|web-language)\.spec\.ts/,
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5193',
    headless: true,
    trace: 'retain-on-failure',
    // Los tests buscan textos en español y fechas fijas, sea cual sea el ordenador.
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid'
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5193 --strictPort',
    cwd: '../web',
    url: 'http://127.0.0.1:5193',
    reuseExistingServer: false,
    // Si el puerto está ocupado, Vite falla al instante en lugar de elegir otro
    // y dejar a Playwright esperando un servidor que nunca llega
    timeout: 30_000
  }
})
