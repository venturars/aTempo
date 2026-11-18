import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { CourseResponseDto } from '../course/course-response.dto'
import { POSTGRES_MOCK_COURSES } from './postgres-mock'

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name)
  private pool: Pool | undefined

  usesMock(): boolean {
    if (process.env.POSTGRES_MOCK === '1') {
      return true
    }

    const connectionString = process.env.DATABASE_URL
    return connectionString === undefined || connectionString.trim() === ''
  }

  private poolFor(connectionString: string): Pool {
    if (!this.pool) {
      this.pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
      this.pool.on('error', (error) => {
        this.logger.error(`Idle Postgres client failed: ${error.message}`)
      })
    }

    return this.pool
  }

  async check(): Promise<void> {
    if (this.usesMock()) {
      return
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
    await pool.query('SELECT 1')
  }

  async listCourses(): Promise<CourseResponseDto[]> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_COURSES
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
    const result = await pool.query<{
      id: string
      organization_id: string
      name: string
      acronym: string
      start_at: Date | string
      end_at: Date | string
      contract_address: string
    }>(
      `SELECT id, organization_id, name, acronym, start_at, end_at, contract_address
       FROM course`,
    )

    return result.rows.map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      acronym: row.acronym,
      start_at: formatTimestamp(row.start_at),
      end_at: formatTimestamp(row.end_at),
      contract_address: row.contract_address,
    }))
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}

function formatTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}
