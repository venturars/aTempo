import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.ATEMPO_API_ROUTER_PORT ?? '3004'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
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
