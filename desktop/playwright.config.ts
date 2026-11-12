import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  workers: 1,
  reporter: 'line'
})
