import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

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

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}