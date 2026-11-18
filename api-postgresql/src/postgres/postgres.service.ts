import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import { POSTGRES_MOCK_PERSON_COURSES } from './postgres-mock'

export interface PersonCourseRow {
  person_id: string
  course_id: string
}

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name)
  private pool: Pool | undefined

  async check(): Promise<void> {
    await this.getPool().query('SELECT 1')
  }

  async listPersonCourses(): Promise<PersonCourseRow[]> {
    if (this.usesMock()) {
      // El modo local permite probar el endpoint sin configurar PostgreSQL.
      return POSTGRES_MOCK_PERSON_COURSES
    }

    const result = await this.getPool().query<PersonCourseRow>(
      'SELECT person_id, course_id FROM person_course',
    )
    return result.rows
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }

  private usesMock(): boolean {
    return process.env.POSTGRES_MOCK === '1' || !process.env.DATABASE_URL
  }

  private getPool(): Pool {
    const connectionString = process.env.DATABASE_URL
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
}
