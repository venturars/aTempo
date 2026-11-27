import { defineConfig } from '@playwright/test'
import adminConfig from './playwright.admin.config'

export default defineConfig({
  testDir: './tests',
  // Las pruebas de la web necesitan el servidor que arranca playwright.admin.config.ts.
  testIgnore: adminConfig.testMatch,
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  workers: 1,
  reporter: 'line'
})
