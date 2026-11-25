/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type -- Electron must install these synchronous CJS guards before loading the built main. */
const electron = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow } = electron
const audit = { attempts: [], violations: [], windows: 0 }
globalThis.__hiddenElectronAudit = audit
// Las capturas no dependen de si macOS muestra las barras de desplazamiento (ratón o trackpad).
app.commandLine.appendSwitch('hide-scrollbars')
// Los tests buscan textos en español: el sistema simulado está en español salvo que el test
// pida otro idioma con --test-lang=<locale>.
const testLang = process.argv.find((arg) => arg.startsWith('--test-lang='))
app.commandLine.appendSwitch('lang', testLang ? testLang.slice('--test-lang='.length) : 'es-ES')
function record(event, detail) {
  fs.appendFileSync(
    process.env.ATEMPO_NATIVE_AUDIT,
    JSON.stringify({ time: Date.now(), event, detail }) + '\n'
  )
}
globalThis.__hiddenElectronRecord = record
function abort(message) {
  try {
    audit.violations.push(message)
    record('abort', message)
  } finally {
    process.stderr.write(`Hidden Electron violation: ${message}\n`)
    app.exit(1)
  }
}
// Installed before any guard or real main can throw; avoid Electron's error dialog.
process.on('uncaughtException', (error) => abort(error.stack || String(error)))
process.on('unhandledRejection', (error) => abort(String(error)))
function block(target, method) {
  Object.defineProperty(target, method, {
    configurable: false,
    writable: false,
    value() {
      audit.attempts.push(method)
      record('blocked', method)
    }
  })
}

try {
  require('./hidden-preflight.cjs').preflight()
  record('bootstrap', process.pid)
  // Each launch gets its own profile: the saved theme and the local database must not leak between tests or into the real app.
  app.setPath('userData', path.join(path.dirname(process.env.ATEMPO_NATIVE_AUDIT), 'user-data'))
  // Install before loading the real main, including its ready-to-show handler.
  for (const method of [
    'show',
    'showInactive',
    'focus',
    'moveTop',
    'restore',
    'maximize',
    'setFullScreen'
  ]) {
    block(BrowserWindow.prototype, method)
  }
  block(app, 'focus')
  if (process.platform === 'darwin') {
    app.setActivationPolicy('prohibited')
    Object.defineProperty(app, 'setActivationPolicy', {
      configurable: false,
      writable: false,
      value(policy) {
        if (policy !== 'prohibited') abort(`activation policy ${policy}`)
      }
    })
    block(app.dock, 'show')
  }
  app.on('before-quit', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      const state = { id: window.id, visible: window.isVisible(), focused: window.isFocused() }
      record('window-before-quit', state)
      if (state.visible || state.focused) abort('window visible/focused at quit')
    }
  })
  app.on('quit', (_, code) => record('quit', code))
  app.on('browser-window-created', (_, window) => {
    audit.windows++
    record('window-created', {
      id: window.id,
      visible: window.isVisible(),
      focused: window.isFocused()
    })
    for (const event of ['show', 'focus']) {
      window.on(event, () => abort(`native ${event} on window ${window.id}`))
    }
    window.webContents.setBackgroundThrottling(false)
    if (window.isVisible() || window.isFocused()) abort('window created visible or focused')
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  })
} catch (error) {
  abort(`Cannot install hidden guards: ${error.message}`)
  throw error
}
try {
  record('guards-installed', true)
  require(path.resolve(__dirname, '../../out/main/index.js'))
} catch (error) {
  abort(error.stack || String(error))
}
