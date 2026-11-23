#!/usr/bin/env node
// Login real: desktop-equivalent POST /auth/login on the router.
// Auth0 then sdk afterAuth then api-postgresql /health.
// Prints only status codes. Does not print tokens or secrets.

const routerUrl = (process.env.API_ROUTER_URL || 'http://127.0.0.1:3000').replace(
  /\/+$/,
  '',
)
const email = process.env.ATEMPO_LIVE_EMAIL
const password = process.env.ATEMPO_LIVE_PASSWORD

async function main() {
  if (!email || !password) {
    throw new Error('ATEMPO_LIVE_EMAIL and ATEMPO_LIVE_PASSWORD are required')
  }

  const response = await fetch(`${routerUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await response.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code : ''

  if (response.status === 200 && typeof body.accessToken === 'string') {
    process.stdout.write('login 200: Auth0 and api-postgresql health succeeded\n')
    return
  }

  process.stderr.write(`login ${response.status}${code ? ` ${code}` : ''}\n`)
  process.exit(1)
}

main().catch((error) => {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n')
  process.exit(1)
})
