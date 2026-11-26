import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['node:sqlite']
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        // La administración es el mismo código que la web (#265).
        '@web': resolve('../web/src')
      },
      // El código de web/ debe usar las mismas copias que el renderer, o los hooks se rompen.
      dedupe: ['react', 'react-dom', 'zustand', '@tanstack/react-router']
    },
    server: {
      fs: {
        allow: [resolve('..')]
      }
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        routesDirectory: resolve('src/renderer/src/routes'),
        generatedRouteTree: resolve('src/renderer/src/routeTree.gen.ts')
      }),
      react(),
      tailwindcss()
    ]
  }
})
