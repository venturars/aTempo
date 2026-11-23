import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const desktopRoot = join(projectRoot, 'desktop')
const electronVite = join(desktopRoot, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')

function readOptions(args) {
  let port = 3004
  let routerOnly = false

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--router-only') {
      routerOnly = true
    } else if (args[index] === '--port') {
      port = Number(args[++index])
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('El puerto debe ser un numero entre 1 y 65535.')
      }
    } else {
      throw new Error(`Opcion desconocida: ${args[index]}`)
    }
  }

  return { port, routerOnly }
}

function findEnvFile() {
  const envFiles = [join(projectRoot, '.env'), resolve(projectRoot, '..', '..', '.env')]
  const envFile = envFiles.find((file) => existsSync(file))
  if (!envFile) throw new Error('Falta el .env con la configuracion de Auth0.')
  return envFile
}

function dockerIsReady() {
  const result = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { stdio: 'ignore' })
  return result.status === 0
}

function runDocker(args, environment = process.env) {
  const result = spawnSync('docker', args, {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`docker ${args.slice(0, 2).join(' ')} ha fallado.`)
}

async function waitForDocker() {
  if (dockerIsReady()) return

  // Docker Desktop se puede iniciar desde su CLI; otros motores deben estar en marcha.
  runDocker(['desktop', 'start'])
  for (let attempt = 0; attempt < 30; attempt++) {
    await delay(2000)
    if (dockerIsReady()) return
  }
  throw new Error('Docker no ha terminado de arrancar.')
}

async function waitForRouter(port) {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(2000)
      })
      if (response.ok && (await response.json()).status === 'ok') return
    } catch {
      // El router puede seguir compilando durante el arranque.
    }
    await delay(1000)
  }
  throw new Error(`api-router no responde en http://localhost:${port}/health.`)
}

function startElectron(port) {
  return new Promise((resolveApp, rejectApp) => {
    const electron = spawn(process.execPath, [electronVite, 'dev'], {
      cwd: desktopRoot,
      env: { ...process.env, ATEMPO_API_ROUTER_URL: `http://localhost:${port}` },
      stdio: 'inherit'
    })
    electron.once('error', rejectApp)
    electron.once('close', (code) => {
      if (code === 0) resolveApp()
      else rejectApp(new Error(`Electron termino con el codigo ${code}.`))
    })
  })
}

async function main() {
  const { port, routerOnly } = readOptions(process.argv.slice(2))
  const envFile = findEnvFile()
  if (!routerOnly && !existsSync(electronVite)) {
    throw new Error('Faltan las dependencias nativas de desktop/. Ejecuta una vez pnpm install en desktop/.')
  }

  await waitForDocker()
  runDocker(['compose', '--env-file', envFile, 'up', '-d', 'api-router'], {
    ...process.env,
    ATEMPO_API_ROUTER_PORT: String(port)
  })
  await waitForRouter(port)
  console.log(`api-router listo en http://localhost:${port}`)

  if (!routerOnly) await startElectron(port)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
