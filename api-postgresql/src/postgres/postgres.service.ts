import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { CourseResponseDto } from '../course/course-response.dto'
import type { PersonCourseResponseDto } from '../person-course/person-course-response.dto'
import type { PersonResponseDto } from '../person/person-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import {
  POSTGRES_MOCK_COURSES,
  POSTGRES_MOCK_PERSON_COURSES,
  POSTGRES_MOCK_PERSONS,
  POSTGRES_MOCK_PERSON_ROLES,
} from './postgres-mock'

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name)
  private pool: Pool | undefined

  usesMock(): boolean {
    if (process.env.POSTGRES_MOCK === '1') return true
    const connectionString = process.env.DATABASE_URL
    return connectionString === undefined || connectionString.trim() === ''
  }

  private poolFor(connectionString: string): Pool {
    if (!this.pool) {
      this.pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 })
      this.pool.on('error', (error) =>
        this.logger.error(`Idle Postgres client failed: ${error.message}`),
      )
    }
    return this.pool
  }

  async check(): Promise<void> {
    if (this.usesMock()) return
    await this.poolFor(process.env.DATABASE_URL!).query('SELECT 1')
  }

  async listPersons(): Promise<PersonResponseDto[]> {
    if (this.usesMock()) return POSTGRES_MOCK_PERSONS
    const result = await this.poolFor(process.env.DATABASE_URL!).query<{
      id: string
      identification_document: string
      email: string
      first_name: string
      last_name: string
      birth_date: Date | string | null
      phone: string | null
    }>(
      'SELECT id, identification_document, email, first_name, last_name, birth_date, phone FROM person',
    )
    return result.rows.map((row) => ({
      ...row,
      birth_date: formatBirthDate(row.birth_date),
    }))
  }

  async listCourses(): Promise<CourseResponseDto[]> {
    if (this.usesMock()) return POSTGRES_MOCK_COURSES
    const result = await this.poolFor(process.env.DATABASE_URL!).query<{
      id: string
      organization_id: string
      name: string
      acronym: string
      start_at: Date | string
      end_at: Date | string
      contract_address: string
    }>(
      'SELECT id, organization_id, name, acronym, start_at, end_at, contract_address FROM course',
    )
    return result.rows.map((row) => ({
      ...row,
      start_at: formatTimestamp(row.start_at),
      end_at: formatTimestamp(row.end_at),
    }))
  }

  async listPersonRoles(): Promise<PersonRoleResponseDto[]> {
    if (this.usesMock()) return POSTGRES_MOCK_PERSON_ROLES
    const result = await this.poolFor(
      process.env.DATABASE_URL!,
    ).query<PersonRoleResponseDto>('SELECT person_id, role FROM person_role')
    return result.rows
  }

  async listPersonCourses(): Promise<PersonCourseResponseDto[]> {
    if (this.usesMock()) return POSTGRES_MOCK_PERSON_COURSES

    const result = await this.poolFor(
      process.env.DATABASE_URL!,
    ).query<PersonCourseResponseDto>(
      'SELECT person_id, course_id FROM person_course',
    )
    return result.rows
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}

function formatBirthDate(value: Date | string | null): string | null {
  if (value === null) return null
  return value instanceof Date ? value.toISOString().slice(0, 10) : value
}

function formatTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}
