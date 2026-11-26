import type { Request, Response, CookieOptions } from 'express'

export const accessCookieName = 'atempo_access'
export const refreshCookieName = 'atempo_refresh'
export const identityCookieName = 'atempo_identity'
export const defaultWebOrigin = 'http://localhost:5191'

export function configuredWebOrigin(): string {
  return process.env.ATEMPO_WEB_ORIGIN?.trim() || defaultWebOrigin
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  const cookie = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  if (cookie === undefined) return undefined
  const value = cookie.slice(name.length + 1)
  if (value === '') return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers['x-forwarded-proto']
  const protocol = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol
  return request.secure || protocol?.split(',')[0]?.trim() === 'https'
}

export function authCookieOptions(request: Request): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isSecureRequest(request),
  }
}

export function setAuthCookies(
  response: Response,
  request: Request,
  tokens: { accessToken: string; refreshToken?: string; identity: string },
): void {
  const options = authCookieOptions(request)
  response.cookie(accessCookieName, tokens.accessToken, options)
  if (tokens.refreshToken !== undefined) {
    response.cookie(refreshCookieName, tokens.refreshToken, options)
  }
  response.cookie(identityCookieName, tokens.identity, options)
}

export function clearAuthCookies(response: Response, request: Request): void {
  const options = authCookieOptions(request)
  response.clearCookie(accessCookieName, options)
  response.clearCookie(refreshCookieName, options)
  response.clearCookie(identityCookieName, options)
}
