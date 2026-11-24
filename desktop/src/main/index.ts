import { app, ipcMain, safeStorage, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeDatabase, openDatabase } from './database'

type LoginCredentials = { email: string; password: string }
type AuthUser = { sub: string; email: string }

let encryptedAccessToken: Buffer | null = null
let encryptedRefreshToken: Buffer | null = null
let authenticatedEmail: string | null = null

const apiRouterUrl = process.env.ATEMPO_API_ROUTER_URL?.replace(/\/$/, '') ?? ''
const requestTimeout = 10_000

function clearAuthSession(): void {
  encryptedAccessToken = null
  encryptedRefreshToken = null
  authenticatedEmail = null
}

function authError(code: string): Error {
  return new Error(code)
}

function resolveApiRouterUrl(): string {
  if (apiRouterUrl === '') throw authError('AUTH_NOT_CONFIGURED')

  let url: URL
  try {
    url = new URL(apiRouterUrl)
  } catch {
    throw authError('AUTH_ROUTER_URL_UNSAFE')
  }

  const isLoopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)
  const usesSecureTransport = url.protocol === 'https:'
  const usesDevelopmentLoopback = url.protocol === 'http:' && isLoopback
  if (
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    (!usesSecureTransport && !usesDevelopmentLoopback)
  ) {
    throw authError('AUTH_ROUTER_URL_UNSAFE')
  }

  return url.toString().replace(/\/$/, '')
}

function isSecureStorageReady(): boolean {
  if (!safeStorage.isEncryptionAvailable()) return false
  return process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text'
}

function readEncryptedToken(encrypted: Buffer | null): string | null {
  if (encrypted === null) return null
  if (!isSecureStorageReady()) {
    clearAuthSession()
    return null
  }

  return safeStorage.decryptString(encrypted)
}

function readAccessToken(): string | null {
  return readEncryptedToken(encryptedAccessToken)
}

function readRefreshToken(): string | null {
  return readEncryptedToken(encryptedRefreshToken)
}

function storeTokens(accessToken: string, refreshToken?: string): void {
  encryptedAccessToken = safeStorage.encryptString(accessToken)
  encryptedRefreshToken =
    typeof refreshToken === 'string' && refreshToken !== ''
      ? safeStorage.encryptString(refreshToken)
      : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readRefreshToken()
  if (refreshToken === null) return null

  let response: Response
  try {
    response = await fetch(`${resolveApiRouterUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(requestTimeout)
    })
  } catch {
    return null
  }

  if (!response.ok) return null
  const body: unknown = await response.json().catch(() => null)
  if (!isRecord(body) || typeof body.token !== 'string' || body.token === '') return null

  const nextRefresh =
    typeof body.refreshToken === 'string' && body.refreshToken !== ''
      ? body.refreshToken
      : refreshToken
  storeTokens(body.token, nextRefresh)
  return body.token
}

async function requestCurrentUser(
  accessToken: string,
  allowRefresh = true
): Promise<{ sub: string } | null> {
  const response = await fetch(`${resolveApiRouterUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(requestTimeout)
  })

  if (response.status === 401) {
    if (allowRefresh) {
      const nextAccessToken = await refreshAccessToken()
      if (nextAccessToken !== null) return requestCurrentUser(nextAccessToken, false)
    }
    clearAuthSession()
    return null
  }
  if (!response.ok) throw authError('AUTH_SERVICE_UNAVAILABLE')

  const body: unknown = await response.json()
  if (!isRecord(body) || typeof body.sub !== 'string') {
    throw authError('AUTH_RESPONSE_INVALID')
  }

  return { sub: body.sub }
}

async function completeAuthenticatedSession(
  accessToken: string,
  email: string,
  refreshToken?: string
): Promise<AuthUser> {
  storeTokens(accessToken, refreshToken)
  authenticatedEmail = email

  let user: { sub: string } | null
  try {
    user = await requestCurrentUser(accessToken)
  } catch {
    clearAuthSession()
    throw authError('AUTH_SERVICE_UNAVAILABLE')
  }
  if (user === null) throw authError('INVALID_CREDENTIALS')
  return { ...user, email }
}

function registerAuthHandlers(): void {
  ipcMain.handle('auth:is-configured', () => apiRouterUrl !== '')

  ipcMain.handle('auth:login', async (_event, credentials: LoginCredentials): Promise<AuthUser> => {
    const routerUrl = resolveApiRouterUrl()
    if (!isSecureStorageReady()) throw authError('SECURE_STORAGE_UNAVAILABLE')
    if (
      typeof credentials?.email !== 'string' ||
      typeof credentials.password !== 'string' ||
      credentials.email.trim() === '' ||
      credentials.password === ''
    ) {
      throw authError('INVALID_CREDENTIALS')
    }
    clearAuthSession()

    let response: Response
    try {
      response = await fetch(`${routerUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: AbortSignal.timeout(requestTimeout)
      })
    } catch {
      throw authError('AUTH_SERVICE_UNAVAILABLE')
    }

    if (response.status === 401) throw authError('INVALID_CREDENTIALS')
    if (!response.ok) throw authError('AUTH_SERVICE_UNAVAILABLE')

    const body: unknown = await response.json()
    if (!isRecord(body) || typeof body.accessToken !== 'string' || body.accessToken === '') {
      throw authError('AUTH_RESPONSE_INVALID')
    }

    const refreshToken =
      typeof body.refreshToken === 'string' && body.refreshToken !== ''
        ? body.refreshToken
        : undefined
    return completeAuthenticatedSession(
      body.accessToken,
      credentials.email.trim().toLowerCase(),
      refreshToken
    )
  })

  ipcMain.handle(
    'auth:register',
    async (_event, credentials: LoginCredentials): Promise<AuthUser> => {
      const routerUrl = resolveApiRouterUrl()
      if (!isSecureStorageReady()) throw authError('SECURE_STORAGE_UNAVAILABLE')
      if (
        typeof credentials?.email !== 'string' ||
        typeof credentials.password !== 'string' ||
        credentials.email.trim() === '' ||
        credentials.password === ''
      ) {
        throw authError('INVALID_CREDENTIALS')
      }
      clearAuthSession()

      let response: Response
      try {
        response = await fetch(`${routerUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          signal: AbortSignal.timeout(requestTimeout)
        })
      } catch {
        throw authError('AUTH_SERVICE_UNAVAILABLE')
      }

      if (response.status === 409) throw authError('USER_EXISTS')
      if (response.status === 400) throw authError('INVALID_SIGNUP')
      if (!response.ok) throw authError('AUTH_SERVICE_UNAVAILABLE')

      const body: unknown = await response.json()
      if (
        !isRecord(body) ||
        typeof body.token !== 'string' ||
        body.token === '' ||
        typeof body.refreshToken !== 'string' ||
        body.refreshToken === ''
      ) {
        throw authError('AUTH_RESPONSE_INVALID')
      }

      return completeAuthenticatedSession(
        body.token,
        credentials.email.trim().toLowerCase(),
        body.refreshToken
      )
    }
  )

  ipcMain.handle('auth:me', async (): Promise<AuthUser | null> => {
    if (apiRouterUrl === '') return null
    const accessToken = readAccessToken()
    if (accessToken === null) return null

    const user = await requestCurrentUser(accessToken)
    return user === null || authenticatedEmail === null
      ? null
      : { ...user, email: authenticatedEmail }
  })

  ipcMain.handle('auth:logout', async () => {
    const refreshToken = readRefreshToken()
    if (refreshToken !== null) {
      try {
        await fetch(`${resolveApiRouterUrl()}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          signal: AbortSignal.timeout(requestTimeout)
        })
      } catch {
        // Local session still has to disappear if Auth0 cannot be reached.
      }
    }
    clearAuthSession()
  })
}

function startupHash(): string | undefined {
  if (process.argv.includes('--dashboard')) {
    return '/student/dashboard'
  }

  if (process.argv.includes('--sign-up')) {
    return '/sign-up'
  }

  if (process.argv.includes('--organization-dashboard')) {
    return '/organization/dashboard'
  }

  return undefined
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#141826',
    title: 'aTempo',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const hash = startupHash()

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const rendererUrl =
      hash === undefined
        ? process.env['ELECTRON_RENDERER_URL']
        : `${process.env['ELECTRON_RENDERER_URL']}#${hash}`
    mainWindow.loadURL(rendererUrl)
  } else if (hash === undefined) {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  openDatabase()
  registerAuthHandlers()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  clearAuthSession()
  closeDatabase()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
