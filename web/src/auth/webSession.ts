export type WebProfile = 'admin' | 'student'

export type WebSession = {
  email: string
  profile: WebProfile
}

const loginErrorText = 'El correo o la contraseña no son correctos. Revísalos y prueba otra vez.'

// Ordena los inicios de sesión respecto al cierre para no perder una cookie recién creada.
let pendingLogout: Promise<void> = Promise.resolve()

export function afterPendingLogout(): Promise<void> {
  return pendingLogout
}

function jsonRequest(path: string, method: 'POST' | 'GET', body?: unknown): Promise<Response> {
  return fetch(path, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
}

export async function loginWebSession(email: string, password: string): Promise<WebSession> {
  await afterPendingLogout()
  let response: Response
  try {
    response = await jsonRequest('/api/auth/login', 'POST', {
      email: email.trim().toLowerCase(),
      password
    })
  } catch {
    throw new Error(loginErrorText)
  }
  if (!response.ok) throw new Error(loginErrorText)
  return (await response.json()) as WebSession
}

async function requestSession(): Promise<Response | null> {
  return jsonRequest('/api/auth/me', 'GET').catch(() => null)
}

export async function readWebSession(): Promise<WebSession | null> {
  let response = await requestSession()
  if (response !== null && response.status === 401) {
    const refreshed = await jsonRequest('/api/auth/refresh', 'POST', {}).catch(() => null)
    if (refreshed === null || !refreshed.ok) return null
    response = await requestSession()
  }
  if (response === null || response.status === 401) return null
  if (!response.ok) throw new Error('No se ha podido comprobar la sesión.')
  return (await response.json()) as WebSession
}

export function logoutWebSession(): Promise<void> {
  pendingLogout = jsonRequest('/api/auth/logout', 'POST', {})
    .then((response) => {
      if (!response.ok && response.status !== 204) throw new Error('WEB_LOGOUT_FAILED')
    })
  return pendingLogout
}
