import { query } from '../db'

export async function check(): Promise<void> {
  await query('SELECT 1')
}
