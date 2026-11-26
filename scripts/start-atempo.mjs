import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const webRoot = join(projectRoot, 'web')
const desktopRoot = join(projectRoot, 'desktop')
const webVite = join(webRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const electronVite = join(desktopRoot, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
const webPort = 5191
// El proyecto Compose conserva este nombre aunque cambie el nombre del worktree.
const composeProjectName = 'atempo'

function readOptions(args) {
  let port = 3000
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

export function installDependencies(packageRoot, { run = spawnSync, platform = process.platform } = {}) {
  // En Windows, pnpm.cmd se ejecuta desde cmd.exe con una orden fija.
  const command = platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm'
  const args = platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm install --frozen-lockfile']
    : ['install', '--frozen-lockfile']
  const result = run(command, args, {
    cwd: packageRoot,
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`No se pudieron instalar las dependencias de ${packageRoot}.`)
}

export function prepareDependencies({ exists = existsSync, install = installDependencies } = {}) {
  // Prepara solo los paquetes cuyo ejecutable de desarrollo aún no existe.
  if (!exists(webVite)) {
    console.log('Instalando dependencias de web/.')
    install(webRoot)
  }
  if (!exists(electronVite)) {
    console.log('Instalando dependencias de desktop/.')
    install(desktopRoot)
  }
}

export async function waitForDocker({
  platform = process.platform,
  isReady = dockerIsReady,
  startDesktop = () => runDocker(['desktop', 'start']),
  pause = delay
} = {}) {
  if (isReady()) return
  if (platform !== 'win32' && platform !== 'darwin') {
    throw new Error(`Docker no está disponible en ${platform}. Inicia manualmente el motor Docker y vuelve a intentarlo.`)
  }

  // Solo Windows y macOS admiten el autoarranque de Docker Desktop.
  startDesktop()
  for (let attempt = 0; attempt < 30; attempt++) {
    await pause(2000)
    if (isReady()) return
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

export function startProcess(command, args, options, { start = spawn } = {}) {
  const child = start(command, args, { ...options, stdio: 'inherit' })
  const closed = new Promise((resolveClose, rejectClose) => {
    child.once('error', rejectClose)
    child.once('close', (code, signal) => resolveClose({ code, signal }))
  })
  return { child, closed }
}

export function stopProcess(child) {
  if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
}

export function webProcessOptions(port, environment = process.env) {
  // El proxy web sigue el puerto publicado por Compose, incluso con --port.
  return { cwd: webRoot, env: { ...environment, ATEMPO_API_ROUTER_PORT: String(port) } }
}

export async function superviseFrontends(webProcess, electronProcess) {
  try {
    // Cierra ambos procesos frontend al salir o fallar cualquiera de ellos.
    const outcome = await Promise.race([
      electronProcess.closed.then((result) => ({ process: 'Electron', result })),
      webProcess.closed.then((result) => ({ process: 'web', result }))
    ])
    if (outcome.process === 'web') {
      throw new Error(`El servidor web terminó con el código ${outcome.result.code ?? outcome.result.signal}.`)
    }
    if (outcome.result.code !== 0) {
      throw new Error(`Electron terminó con el código ${outcome.result.code ?? outcome.result.signal}.`)
    }
  } finally {
    stopProcess(electronProcess.child)
    stopProcess(webProcess.child)
  }
}

export async function waitForWeb(webProcess, {
  request = fetch,
  pause = delay,
  port = webPort,
  attempts = 30
} = {}) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const finished = await Promise.race([
      webProcess.closed.then((result) => ({ result })),
      pause(1000).then(() => null)
    ])
    if (finished) throw new Error(`El servidor web terminó antes de estar listo (código ${finished.result.code}).`)
    try {
      const response = await request(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1000) })
      if (response.ok) return
    } catch {
      // Vite puede seguir compilando durante el arranque.
    }
  }
  throw new Error(`La web no responde en http://localhost:${port}/.`)
}

export async function main() {
  const { port, routerOnly } = readOptions(process.argv.slice(2))
  const envFile = findEnvFile()
  if (!routerOnly) prepareDependencies()

  await waitForDocker()
  const composeArgs = ['compose', '--env-file', envFile, '-p', composeProjectName]
  const composeEnvironment = {
    ...process.env,
    ATEMPO_API_ROUTER_PORT: String(port)
  }
  // Reutiliza las dependencias del router del proyecto Compose principal.
  runDocker([...composeArgs, 'run', '--rm', '--no-deps', 'api-router', 'pnpm', 'install', '--frozen-lockfile'], composeEnvironment)
  if (!routerOnly) {
    // Prepara los volúmenes de las APIs antes de iniciar sus servicios persistentes.
    for (const service of ['api-postgresql', 'api-rustfs']) {
      runDocker([...composeArgs, 'run', '--rm', '--no-deps', service, 'pnpm', 'install', '--frozen-lockfile'], composeEnvironment)
    }
    runDocker([
      ...composeArgs, 'run', '--rm', '--no-deps', 'api-sqlite', 'sh', '-c',
      'test -x .venv/bin/python || python3.13 -m venv .venv; .venv/bin/python -m pip install --disable-pip-version-check --no-cache-dir .'
    ], composeEnvironment)
  }
  const services = routerOnly
    ? ['api-router']
    : ['api-router', 'api-postgresql', 'api-sqlite', 'api-rustfs', 'datasette']
  runDocker([...composeArgs, 'up', '-d', '--wait', ...services], composeEnvironment)
  await waitForRouter(port)
  console.log(`api-router listo en http://localhost:${port}`)

  if (routerOnly) return

  const webProcess = startProcess(process.execPath, [webVite, '--port', String(webPort), '--strictPort'], webProcessOptions(port))
  let electronProcess
  try {
    await waitForWeb(webProcess)
    console.log(`Web lista en http://localhost:${webPort}`)
    electronProcess = startProcess(process.execPath, [electronVite, 'dev'], {
      cwd: desktopRoot,
      env: { ...process.env, ATEMPO_API_ROUTER_URL: `http://localhost:${port}` }
    })
    await superviseFrontends(webProcess, electronProcess)
  } finally {
    if (!electronProcess) stopProcess(webProcess.child)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
