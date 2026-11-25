export type WebProfile = 'admin' | 'student'

export type WebSession = {
  sub: string
  email: string
  profile: WebProfile
}

const loginErrorText = 'El correo o la contraseña no son correctos. Revísalos y prueba otra vez.'

// Ordena los inicios de sesión respecto al cierre para no perder una cookie recién creada.
let pendingLogout: Promise<void> = Promise.resolve()

export function afterPendingLogout(): Promise<void> {
  return pendingLogout
}

export async function loginWebSession(email: string, password: string): Promise<WebSession> {
  await afterPendingLogout()
  let response: Response
  try {
    response = await fetch('/api/auth/web/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password })
    })
  } catch {
    throw new Error(loginErrorText)
  }
  if (!response.ok) throw new Error(loginErrorText)
  return (await response.json()) as WebSession
}

export async function readWebSession(): Promise<WebSession | null> {
  const response = await fetch('/api/auth/web/session', { credentials: 'include' }).catch(
    () => null
  )
  if (response === null || response.status === 401) return null
  if (!response.ok) throw new Error('No se ha podido comprobar la sesión.')
  return (await response.json()) as WebSession
}

export function logoutWebSession(): Promise<void> {
  pendingLogout = fetch('/api/auth/web/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then((response) => {
      if (!response.ok) throw new Error('WEB_LOGOUT_FAILED')
    })
  return pendingLogout
}
