import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Pool } from 'pg'
import type { CourseResponseDto } from '../course/course-response.dto'
import type { OrganizationResponseDto } from '../organization/organization-response.dto'
import type { PersonCourseResponseDto } from '../person-course/person-course-response.dto'
import type { PersonResponseDto } from '../person/person-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import {
  POSTGRES_MOCK_COURSES,
  POSTGRES_MOCK_ORGANIZATIONS,
  POSTGRES_MOCK_PERSON_COURSES,
  POSTGRES_MOCK_PERSONS,
  POSTGRES_MOCK_PERSON_ROLES,
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
    const result = await this.poolFor(process.env.DATABASE_URL!).query<PersonRow>(
      `SELECT ${PERSON_COLUMNS} FROM person`,
    )
    return result.rows
  }

  async findPersonById(id: string): Promise<PersonResponseDto | null> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_PERSONS.find((person) => person.id === id) ?? null
    }
    const result = await this.poolFor(process.env.DATABASE_URL!).query<PersonRow>(
      `SELECT ${PERSON_COLUMNS} FROM person WHERE id = $1`,
      [id],
    )
    return result.rows[0] ?? null
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

  async listOrganizations(): Promise<OrganizationResponseDto[]> {
    if (this.usesMock()) return POSTGRES_MOCK_ORGANIZATIONS
    const result = await this.poolFor(
      process.env.DATABASE_URL!,
    ).query<OrganizationResponseDto>(
      'SELECT id, name, tax_id FROM organization',
    )
    return result.rows
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

  async deletePersonCourse(
    personId: string,
    courseId: string,
  ): Promise<PersonCourseResponseDto | null> {
    if (this.usesMock()) {
      return (
        POSTGRES_MOCK_PERSON_COURSES.find(
          (row) => row.person_id === personId && row.course_id === courseId,
        ) ?? null
      )
    }

    const result = await this.poolFor(
      process.env.DATABASE_URL!,
    ).query<PersonCourseResponseDto>(
      'DELETE FROM person_course WHERE person_id = $1 AND course_id = $2 RETURNING person_id, course_id',
      [personId, courseId],
    )
    return result.rows[0] ?? null
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end()
  }
}

function formatTimestamp(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}
