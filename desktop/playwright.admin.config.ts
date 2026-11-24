import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: /admin-(store|web)\.spec\.ts/,
  workers: 1,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:5193', headless: true, trace: 'retain-on-failure' },
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
