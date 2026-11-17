import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private pool: Pool | undefined

  async check(): Promise<void> {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('Falta DATABASE_URL')
    }

    if (!this.pool) {
      this.pool = new Pool({ connectionString })
    }

    await this.pool.query('SELECT 1')
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}
