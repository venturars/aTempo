import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  server: {
    fs: {
      allow: [resolve(import.meta.dirname, '..')]
    }
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      routesDirectory: resolve('src/routes'),
      generatedRouteTree: resolve('src/routeTree.gen.ts')
    }),
    react(),
    tailwindcss()
  ]
})
