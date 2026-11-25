export type RouterMethod = 'GET' | 'POST' | 'PUT'

export type RouterRequest = {
  method: RouterMethod
  path: string
  body?: unknown
}

export type RouterResponse =
  | { kind: 'response'; status: number; statusText: string; body: unknown }
  | { kind: 'no-response'; reason: 'timeout' | 'network' }
