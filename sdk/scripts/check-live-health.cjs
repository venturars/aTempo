#!/usr/bin/env node
// Comprueba afterAuth contra un api-postgresql real. Sin Auth0.
// Uso: API_POSTGRESQL_URL=http://api-postgresql:3001 node scripts/check-live-health.cjs

const loadAfterAuth = require('./load-after-auth.cjs')

async function main() {
  const afterAuth = loadAfterAuth()
  const result = await afterAuth({ email: 'ci@atempo.test' })
  if (result.identity.email !== 'ci@atempo.test') {
    throw new Error('afterAuth did not keep the email')
  }
  if (result.postgres.status !== 'ok') {
    throw new Error('api-postgresql health is not ok')
  }
  process.stdout.write('sdk afterAuth reached api-postgresql /health\n')
}

main().catch((error) => {
  process.stderr.write(String(error && error.message ? error.message : error) + '\n')
  process.exit(1)
})
