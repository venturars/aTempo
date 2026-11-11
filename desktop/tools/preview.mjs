import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('../src/renderer', import.meta.url)),
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 5177, strictPort: true }
})
await server.listen()
server.printUrls()
