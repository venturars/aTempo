import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import {
  installDependencies,
  prepareDependencies,
  startProcess,
  superviseFrontends,
  stopProcess,
  waitForWeb,
  waitForDocker
} from './start-atempo.mjs'

test('prepara solo los paquetes sin ejecutable de desarrollo', () => {
  const installed = []
  const messages = []
  const originalLog = console.log
  console.log = (message) => messages.push(message)

  try {
    prepareDependencies({
      exists: (path) => path.includes('web'),
      install: (path) => installed.push(path)
    })
  } finally {
    console.log = originalLog
  }

  assert.equal(installed.length, 1)
  assert.match(installed[0], /desktop$/)
  assert.deepEqual(messages, ['Instalando dependencias de desktop/.'])
})

test('instala dependencias de web y desktop cuando faltan ambos ejecutables', () => {
  const installed = []
  const originalLog = console.log
  console.log = () => {}

  try {
    prepareDependencies({ exists: () => false, install: (path) => installed.push(path) })
  } finally {
    console.log = originalLog
  }

  assert.equal(installed.length, 2)
  assert.match(installed[0], /web$/)
  assert.match(installed[1], /desktop$/)
})

test('usa cmd.exe para ejecutar pnpm.cmd en Windows', () => {
  let invocation

  installDependencies('C:/proyecto/web', {
    platform: 'win32',
    run: (...args) => {
      invocation = args
      return { status: 0 }
    }
  })

  assert.equal(invocation[0], process.env.ComSpec ?? 'cmd.exe')
  assert.deepEqual(invocation[1], ['/d', '/s', '/c', 'pnpm install --frozen-lockfile'])
  assert.equal(invocation[2].cwd, 'C:/proyecto/web')
})

test('propaga errores y códigos distintos de cero al instalar', () => {
  const spawnError = new Error('pnpm no está disponible')
  assert.throws(
    () => installDependencies('/proyecto/web', { run: () => ({ error: spawnError }) }),
    (error) => error === spawnError
  )
  assert.throws(
    () => installDependencies('/proyecto/web', { run: () => ({ status: 1 }) }),
    /No se pudieron instalar las dependencias/
  )
})

test('espera a que la web responda correctamente y consulta su raíz', async () => {
  const requests = []
  let pauses = 0
  await waitForWeb({ closed: new Promise(() => {}) }, {
    port: 5191,
    pause: async () => { pauses += 1 },
    request: async (url) => {
      requests.push(url)
      return { ok: requests.length === 2 }
    }
  })

  assert.equal(pauses, 2)
  assert.deepEqual(requests, ['http://localhost:5191/', 'http://localhost:5191/'])
})

test('falla al esperar si el servidor web se cierra antes de responder', async () => {
  await assert.rejects(
    waitForWeb({ closed: Promise.resolve({ code: 3 }) }, {
      pause: async () => {},
      request: async () => ({ ok: true })
    }),
    /terminó antes de estar listo.*3/
  )
})

test('falla cuando se agotan los intentos de espera de la web', async () => {
  await assert.rejects(
    waitForWeb({ closed: new Promise(() => {}) }, {
      attempts: 2,
      pause: async () => {},
      request: async () => ({ ok: false })
    }),
    /La web no responde/
  )
})

test('resuelve el cierre del proceso con código y señal', async () => {
  const child = new EventEmitter()
  const processResult = startProcess('node', ['dev'], { cwd: '/proyecto' }, {
    start: (command, args, options) => {
      assert.equal(command, 'node')
      assert.deepEqual(args, ['dev'])
      assert.equal(options.stdio, 'inherit')
      return child
    }
  })

  child.emit('close', 0, null)
  assert.deepEqual(await processResult.closed, { code: 0, signal: null })
})

test('rechaza el proceso si spawn emite un error', async () => {
  const child = new EventEmitter()
  const processResult = startProcess('node', [], {}, { start: () => child })
  const spawnError = new Error('no se pudo iniciar')
  child.emit('error', spawnError)
  await assert.rejects(processResult.closed, (error) => error === spawnError)
})

test('detiene el proceso activo y deja en paz al que ya terminó', () => {
  const signals = []
  stopProcess({ exitCode: null, signalCode: null, kill: (signal) => signals.push(signal) })
  stopProcess({ exitCode: 0, signalCode: null, kill: (signal) => signals.push(signal) })
  stopProcess(null)
  assert.deepEqual(signals, ['SIGTERM'])
})

test('en Linux indica iniciar Docker manualmente sin invocar Docker Desktop', async () => {
  let desktopStartCount = 0

  await assert.rejects(
    waitForDocker({
      platform: 'linux',
      isReady: () => false,
      startDesktop: () => { desktopStartCount += 1 }
    }),
    /Inicia manualmente el motor Docker/
  )

  assert.equal(desktopStartCount, 0)
})

test('inicia Docker Desktop en Windows y macOS hasta que el motor esté listo', async () => {
  for (const platform of ['win32', 'darwin']) {
    let readinessChecks = 0
    let desktopStartCount = 0

    await waitForDocker({
      platform,
      isReady: () => {
        readinessChecks += 1
        return readinessChecks > 1
      },
      startDesktop: () => { desktopStartCount += 1 },
      pause: async () => {}
    })

    assert.equal(desktopStartCount, 1, `${platform} debe iniciar Docker Desktop una vez`)
    assert.equal(readinessChecks, 2, `${platform} debe volver a comprobar que Docker está listo`)
  }
})

test('al cerrar Electron con código cero, detiene solo la web activa', async () => {
  const webSignals = []
  const electronSignals = []
  const webProcess = {
    child: { exitCode: null, signalCode: null, kill: (signal) => webSignals.push(signal) },
    closed: new Promise(() => {})
  }
  const electronProcess = {
    child: { exitCode: 0, signalCode: null, kill: (signal) => electronSignals.push(signal) },
    closed: Promise.resolve({ code: 0, signal: null })
  }

  await superviseFrontends(webProcess, electronProcess)

  assert.deepEqual(webSignals, ['SIGTERM'])
  assert.deepEqual(electronSignals, [])
})

test('si Electron termina con código no cero, propaga el error y detiene solo la web activa', async () => {
  const webSignals = []
  const electronSignals = []
  const webProcess = {
    child: { exitCode: null, signalCode: null, kill: (signal) => webSignals.push(signal) },
    closed: new Promise(() => {})
  }
  const electronProcess = {
    child: { exitCode: 1, signalCode: null, kill: (signal) => electronSignals.push(signal) },
    closed: Promise.resolve({ code: 1, signal: null })
  }

  await assert.rejects(
    superviseFrontends(webProcess, electronProcess),
    /Electron terminó con el código 1/
  )

  assert.deepEqual(webSignals, ['SIGTERM'])
  assert.deepEqual(electronSignals, [])
})

test('cierra web y Electron si la supervisión de la web rechaza', async () => {
  const webSignals = []
  const electronSignals = []
  const webError = new Error('falló la supervisión web')
  const webProcess = {
    child: { exitCode: null, signalCode: null, kill: (signal) => webSignals.push(signal) },
    closed: Promise.reject(webError)
  }
  const electronProcess = {
    child: { exitCode: null, signalCode: null, kill: (signal) => electronSignals.push(signal) },
    closed: new Promise(() => {})
  }

  await assert.rejects(
    superviseFrontends(webProcess, electronProcess),
    (error) => error === webError
  )

  assert.deepEqual(webSignals, ['SIGTERM'])
  assert.deepEqual(electronSignals, ['SIGTERM'])
})
