import { query } from './pool'

export async function check(): Promise<{ ok: true }> {
  await query('SELECT 1')
  return { ok: true }
}
