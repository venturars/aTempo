import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: /(admin-(store|web)|web-invite)\.spec\.ts/,
  workers: 1,
  reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:5193', headless: true },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5193',
    cwd: '../web',
    url: 'http://127.0.0.1:5193',
    reuseExistingServer: false
  }
})
