import type { RouterRequest, RouterResponse } from '../preload/router'

const segment = '[^/?#]+'
const contractRoutes: Record<RouterRequest['method'], RegExp[]> = {
  GET: [
    /^\/sessions\?date=\d{4}-\d{2}-\d{2}$/,
    RegExp(`^/sessions/${segment}$`),
    RegExp(`^/sessions/${segment}/attendances$`),
    RegExp(`^/sessions/${segment}/check-in-code$`),
    RegExp(`^/courses/${segment}/students$`)
  ],
  POST: [RegExp(`^/sessions/${segment}/open$`), RegExp(`^/sessions/${segment}/close$`)],
  PUT: [RegExp(`^/sessions/${segment}/attendances/${segment}$`)]
}

export function isContractRequest(request: unknown): request is RouterRequest {
  if (typeof request !== 'object' || request === null) return false
  const { method, path } = request as Partial<RouterRequest>
  if (method !== 'GET' && method !== 'POST' && method !== 'PUT') return false
  if (typeof path !== 'string') return false
  if (/%2e|%2f|%5c|\\/i.test(path.split('?')[0])) return false
  if (path.split(/[/?]/).some((part) => part === '.' || part === '..')) return false
  return contractRoutes[method].some((route) => route.test(path))
}

export async function sendRouterRequest(
  baseUrl: string,
  accessToken: string | null,
  request: RouterRequest,
  timeout: number
): Promise<RouterResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (request.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken !== null) headers.Authorization = `Bearer ${accessToken}`

  let response: Response
  try {
    response = await fetch(`${baseUrl}${request.path}`, {
      method: request.method,
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: AbortSignal.timeout(timeout)
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    return { kind: 'no-response', reason: timedOut ? 'timeout' : 'network' }
  }

  const body: unknown = await response.json().catch(() => null)
  return { kind: 'response', status: response.status, statusText: response.statusText, body }
}

type RefreshOptions = {
  accessToken: string | null
  budget: number
  refresh: (timeout: number) => Promise<string | null>
  signOut: () => void
}

export async function sendWithRefresh(
  baseUrl: string,
  request: RouterRequest,
  { accessToken, budget, refresh, signOut }: RefreshOptions
): Promise<RouterResponse> {
  const deadline = Date.now() + budget
  const remaining = (): number => Math.max(0, deadline - Date.now())
  const response = await sendRouterRequest(baseUrl, accessToken, request, remaining())
  if (response.kind !== 'response' || response.status !== 401) return response
  const nextAccessToken = accessToken === null ? null : await refresh(remaining())
  if (nextAccessToken === null) {
    signOut()
    return response
  }
  const retried = await sendRouterRequest(baseUrl, nextAccessToken, request, remaining())
  if (retried.kind === 'response' && retried.status === 401) signOut()
  return retried
}
