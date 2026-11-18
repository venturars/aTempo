import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import { POSTGRES_MOCK_PERSON_ROLES } from './postgres-mock'

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

  async listPersonRoles(): Promise<PersonRoleResponseDto[]> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_PERSON_ROLES
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
    const result = await pool.query<PersonRoleResponseDto>(
      `SELECT person_id, role FROM person_role`,
    )

    return result.rows
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}