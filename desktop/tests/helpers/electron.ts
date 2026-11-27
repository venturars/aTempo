import { _electron as electron, type ElectronApplication } from '@playwright/test'
import { spawn, execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { tmpdir } from 'node:os'

const requireLocal = createRequire(__filename)
const appRoot = path.resolve(__dirname, '../..')
const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 25))
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false
    throw error
  }
}
export async function launchHiddenElectron(flags: string[] = []): Promise<ElectronApplication> {
  if (process.platform !== 'darwin') throw new Error('Hidden foreground audit requires macOS')
  requireLocal('./hidden-preflight.cjs').preflight()
  const directory = mkdtempSync(path.join(tmpdir(), 'atempo-hidden-'))
  const wrapper = path.join(directory, 'electron-wrapper')
  writeFileSync(
    wrapper,
    '#!/bin/sh\nset -eu\nprintf "%s\\n" "$$" > "$ATEMPO_PID_FILE"\nexec "$ATEMPO_ELECTRON_BINARY" "$@"\n',
    { mode: 0o700 }
  )
  execFileSync('/bin/sh', ['-n', wrapper])
  const executable = requireLocal('electron') as string
  if (!path.isAbsolute(executable) || !existsSync(executable))
    throw new Error('Missing Electron executable')
  console.log(`Hidden Electron evidence: ${directory}`)
  const watchdog = spawn(
    process.execPath,
    [path.join(__dirname, 'hidden-watchdog.cjs'), directory, String(process.pid)],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
  watchdog.stderr.on('data', (data) =>
    appendFileSync(path.join(directory, 'watchdog-stderr.log'), data)
  )
  let app: ElectronApplication | undefined
  let cleaned = false
  const pid = (): number | undefined => {
    const file = path.join(directory, 'pid')
    if (!existsSync(file)) return undefined
    const value = readFileSync(file, 'utf8').trim()
    if (!/^\d+$/.test(value) || Number(value) <= 1) throw new Error('Invalid owned PID')
    return Number(value)
  }
  const violation = (): void => {
    if (existsSync(path.join(directory, 'failure')))
      throw new Error(readFileSync(path.join(directory, 'failure'), 'utf8'))
  }
  const cleanup = async (): Promise<void> => {
    if (cleaned) return
    const owned = pid()
    if (owned && alive(owned)) process.kill(owned, 'SIGKILL')
    const deadline = Date.now() + 4000
    while (owned && alive(owned) && Date.now() < deadline) await pause()
    if (owned && alive(owned))
      throw new Error(`Owned Electron ${owned} failed to exit; watchdog remains active`)
    writeFileSync(path.join(directory, 'close-request'), 'close')
    const watchDeadline = Date.now() + 4000
    while (watchdog.exitCode === null && Date.now() < watchDeadline) await pause()
    if (watchdog.exitCode === null)
      throw new Error('Watchdog cleanup not confirmed; observer remains active')
    appendFileSync(
      path.join(directory, 'lifecycle.jsonl'),
      JSON.stringify({ time: Date.now(), event: 'cleanup-confirmed', pid: owned }) + '\n'
    )
    cleaned = true
  }
  try {
    const readyDeadline = Date.now() + 5000
    while (!existsSync(path.join(directory, 'ready'))) {
      violation()
      if (watchdog.exitCode !== null || Date.now() > readyDeadline)
        throw new Error('Foreground observer unavailable before launch')
      await pause()
    }
    violation()
    app = await electron.launch({
      executablePath: wrapper,
      env: {
        ...process.env,
        TZ: 'Europe/Madrid',
        ATEMPO_PID_FILE: path.join(directory, 'pid'),
        ATEMPO_ELECTRON_BINARY: executable,
        ATEMPO_NATIVE_AUDIT: path.join(directory, 'native.jsonl')
      } as Record<string, string>,
      args: [
        '--force-device-scale-factor=1',
        path.join(__dirname, 'hidden-electron.cjs'),
        ...flags
      ],
      cwd: appRoot,
      timeout: 15000
    })
    app
      .process()
      .stderr?.on('data', (data) => appendFileSync(path.join(directory, 'stderr.log'), data))
    const runningApp = app
    const originalClose = app.close.bind(app)
    app.close = async () => {
      try {
        violation()
        await assertHidden(runningApp)
        await Promise.race([
          originalClose(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Close deadline')), 5000)
          )
        ])
      } finally {
        await cleanup()
      }
      violation()
    }
    await app.firstWindow({ timeout: 10000 })
    violation()
    await assertHidden(app)
    return app
  } catch (error) {
    appendFileSync(
      path.join(directory, 'lifecycle.jsonl'),
      JSON.stringify({ time: Date.now(), event: 'failure', error: String(error) }) + '\n'
    )
    await cleanup()
    throw error
  }
}
export async function assertHidden(app: ElectronApplication): Promise<void> {
  const state = await app.evaluate(({ BrowserWindow }) => {
    const audit = (
      globalThis as unknown as {
        __hiddenElectronAudit: { attempts: string[]; violations: string[]; windows: number }
      }
    ).__hiddenElectronAudit
    const snapshot = {
      audit,
      windows: BrowserWindow.getAllWindows().map((window) => ({
        visible: window.isVisible(),
        focused: window.isFocused(),
        backgroundThrottling: window.webContents.getBackgroundThrottling()
      }))
    }
    ;(
      globalThis as unknown as { __hiddenElectronRecord: (event: string, detail: unknown) => void }
    ).__hiddenElectronRecord('assert-hidden', snapshot)
    return snapshot
  })
  if (
    !state.audit ||
    state.audit.violations.length ||
    !state.windows.length ||
    state.windows.some((window) => window.visible || window.focused || window.backgroundThrottling)
  )
    throw new Error(`Hidden Electron audit failed: ${JSON.stringify(state)}`)
}
