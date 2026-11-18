import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { PersonResponseDto } from '../person/person-response.dto'

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name)
  private pool: Pool | undefined

  private poolFor(connectionString: string | undefined): Pool {
    if (!connectionString) {
      throw new Error('Falta DATABASE_URL')
    }

    if (!this.pool) {
      this.pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
      this.pool.on('error', (error) => {
        this.logger.error(`Idle Postgres client failed: ${error.message}`)
      })
    }

    return this.pool
  }

  async check(): Promise<void> {
    const pool = this.poolFor(process.env.DATABASE_URL)
    await pool.query('SELECT 1')
  }

  async listPersons(): Promise<PersonResponseDto[]> {
    const pool = this.poolFor(process.env.DATABASE_URL)
    const result = await pool.query<{
      id: string
      identification_document: string
      email: string
      first_name: string
      last_name: string
      birth_date: Date | string | null
      phone: string | null
    }>(
      `SELECT id, identification_document, email, first_name, last_name, birth_date, phone
       FROM person`,
    )

    return result.rows.map((row) => ({
      id: row.id,
      identification_document: row.identification_document,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      birth_date: formatBirthDate(row.birth_date),
      phone: row.phone,
    }))
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}

function formatBirthDate(value: Date | string | null): string | null {
  if (value === null) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return value
}
