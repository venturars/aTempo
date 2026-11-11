import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))

await build({
  root,
  configFile: false,
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'test-results/dashboard-fixture',
    emptyOutDir: true,
    rollupOptions: { input: 'tests/fixtures/dashboard.html' }
  }
})
