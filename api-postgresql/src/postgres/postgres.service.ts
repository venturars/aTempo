import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { PersonResponseDto } from '../person/person-response.dto'
import { POSTGRES_MOCK_PERSONS } from './postgres-mock'
import type { CourseResponseDto } from '../course/course-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import {
  POSTGRES_MOCK_COURSES,
  POSTGRES_MOCK_PERSON_ROLES,
} from './postgres-mock'

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

  async listPersons(): Promise<PersonResponseDto[]> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_PERSONS
  async listCourses(): Promise<CourseResponseDto[]> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_COURSES
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
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
      identification_document: row.identification_document,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      birth_date: formatBirthDate(row.birth_date),
      phone: row.phone,
    }))
      organization_id: row.organization_id,
      name: row.name,
      acronym: row.acronym,
      start_at: formatTimestamp(row.start_at),
      end_at: formatTimestamp(row.end_at),
      contract_address: row.contract_address,
    }))
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

function formatBirthDate(value: Date | string | null): string | null {
  if (value === null) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
function formatTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}