import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { CourseResponseDto } from '../course/course-response.dto'
import type { PersonResponseDto } from '../person/person-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import {
  POSTGRES_MOCK_COURSES,
  POSTGRES_MOCK_PERSON_ROLES,
  POSTGRES_MOCK_PERSONS,
} from './postgres-mock'

type PersonRow = {
  id: string
  identification_document: string
  email: string
  first_name: string
  last_name: string
  birth_date: string | null
  phone: string | null
}

// birth_date se formatea en SQL: pg lo convierte en medianoche local y
// toISOString() lo pasaría a UTC, restando un día en zonas al este de UTC.
const PERSON_COLUMNS = `id, identification_document, email, first_name, last_name,
       to_char(birth_date, 'YYYY-MM-DD') AS birth_date, phone`

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
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
    const result = await pool.query<PersonRow>(
      `SELECT ${PERSON_COLUMNS}
       FROM person`,
    )

    return result.rows.map(toPersonDto)
  }

  async findPersonById(id: string): Promise<PersonResponseDto | null> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_PERSONS.find((person) => person.id === id) ?? null
    }

    const pool = this.poolFor(process.env.DATABASE_URL!)
    const result = await pool.query<PersonRow>(
      `SELECT ${PERSON_COLUMNS}
       FROM person
       WHERE id = $1`,
      [id],
    )

    const row = result.rows[0]
    return row === undefined ? null : toPersonDto(row)
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

function toPersonDto(row: PersonRow): PersonResponseDto {
  return {
    id: row.id,
    identification_document: row.identification_document,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    birth_date: row.birth_date,
    phone: row.phone,
  }
}

function formatTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}
