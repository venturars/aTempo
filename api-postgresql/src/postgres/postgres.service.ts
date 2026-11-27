import { randomUUID } from 'node:crypto'
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

const MOCK_PERSON_COURSE = POSTGRES_MOCK_PERSON_COURSES[0]!

type PersonRow = {
  id: string
  identification_document: string
  email: string
  first_name: string
  last_name: string
  birth_date: string | null
  phone: string | null
}

type CourseRow = {
  id: string
  organization_id: string
  name: string
  acronym: string
  start_at: Date | string
  end_at: Date | string
  contract_address: string
}

type InsertCourseInput = {
  organization_id: string
  name: string
  acronym: string
  start_at: string
  end_at: string
  contract_address: string
}

type UpdateCourseInput = {
  name?: string
  acronym?: string
  start_at?: string
  end_at?: string
  contract_address?: string
}

const COURSE_COLUMNS =
  'id, organization_id, name, acronym, start_at, end_at, contract_address'

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
    const result = await this.poolFor(process.env.DATABASE_URL!).query<CourseRow>(
      `SELECT ${COURSE_COLUMNS} FROM course`,
    )
    return result.rows.map(toCourseDto)
  }

  async findCourseById(id: string): Promise<CourseResponseDto | null> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_COURSES.find((course) => course.id === id) ?? null
    }
    const result = await this.poolFor(process.env.DATABASE_URL!).query<CourseRow>(
      `SELECT ${COURSE_COLUMNS} FROM course WHERE id = $1`,
      [id],
    )
    const row = result.rows[0]
    return row ? toCourseDto(row) : null
  }

  async insertCourse(input: InsertCourseInput): Promise<CourseResponseDto> {
    if (this.usesMock()) {
      const organizationExists = POSTGRES_MOCK_ORGANIZATIONS.some(
        (organization) => organization.id === input.organization_id,
      )
      if (!organizationExists) {
        throw postgresError('23503', 'organization does not exist')
      }
      const duplicate = POSTGRES_MOCK_COURSES.some(
        (course) =>
          (course.organization_id === input.organization_id &&
            course.acronym === input.acronym) ||
          course.contract_address.toLowerCase() ===
            input.contract_address.toLowerCase(),
      )
      if (duplicate) {
        throw postgresError('23505', 'course already exists')
      }
      return {
        id: randomUUID(),
        organization_id: input.organization_id,
        name: input.name,
        acronym: input.acronym,
        start_at: input.start_at,
        end_at: input.end_at,
        contract_address: input.contract_address,
      }
    }

    const result = await this.poolFor(process.env.DATABASE_URL!).query<CourseRow>(
      `INSERT INTO course (organization_id, name, acronym, start_at, end_at, contract_address)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING ${COURSE_COLUMNS}`,
      [
        input.organization_id,
        input.name,
        input.acronym,
        input.start_at,
        input.end_at,
        input.contract_address,
      ],
    )
    return toCourseDto(result.rows[0]!)
  }

  async updateCourse(
    id: string,
    patch: UpdateCourseInput,
  ): Promise<CourseResponseDto | null> {
    if (this.usesMock()) {
      const existing = POSTGRES_MOCK_COURSES.find((course) => course.id === id)
      if (!existing) return null
      const next: CourseResponseDto = {
        ...existing,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.acronym !== undefined ? { acronym: patch.acronym } : {}),
        ...(patch.start_at !== undefined ? { start_at: patch.start_at } : {}),
        ...(patch.end_at !== undefined ? { end_at: patch.end_at } : {}),
        ...(patch.contract_address !== undefined
          ? { contract_address: patch.contract_address }
          : {}),
      }
      const duplicate = POSTGRES_MOCK_COURSES.some(
        (course) =>
          course.id !== id &&
          ((course.organization_id === next.organization_id &&
            course.acronym === next.acronym) ||
            course.contract_address.toLowerCase() ===
              next.contract_address.toLowerCase()),
      )
      if (duplicate) {
        throw postgresError('23505', 'course already exists')
      }
      return next
    }

    const assignments: string[] = []
    const values: unknown[] = []
    const add = (column: string, value: string | undefined) => {
      if (value === undefined) return
      values.push(value)
      assignments.push(`${column} = $${values.length}`)
    }
    add('name', patch.name)
    add('acronym', patch.acronym)
    add('start_at', patch.start_at)
    add('end_at', patch.end_at)
    add('contract_address', patch.contract_address)

    if (assignments.length === 0) {
      return this.findCourseById(id)
    }

    values.push(id)
    const result = await this.poolFor(process.env.DATABASE_URL!).query<CourseRow>(
      `UPDATE course SET ${assignments.join(', ')} WHERE id = $${values.length}
RETURNING ${COURSE_COLUMNS}`,
      values,
    )
    const row = result.rows[0]
    return row ? toCourseDto(row) : null
  }

  async deleteCourse(id: string): Promise<boolean> {
    if (this.usesMock()) {
      return POSTGRES_MOCK_COURSES.some((course) => course.id === id)
    }

    const result = await this.poolFor(process.env.DATABASE_URL!).query(
      'DELETE FROM course WHERE id = $1',
      [id],
    )
    return (result.rowCount ?? 0) > 0
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

  async createPersonCourse(
    personId: string,
    courseId: string,
  ): Promise<PersonCourseResponseDto> {
    if (this.usesMock()) {
      if (
        personId === MOCK_PERSON_COURSE.person_id &&
        courseId === MOCK_PERSON_COURSE.course_id
      ) {
        throw postgresError('23505', 'person_course already exists')
      }
      return { person_id: personId, course_id: courseId }
    }

    const result = await this.poolFor(
      process.env.DATABASE_URL!,
    ).query<PersonCourseResponseDto>(
      `INSERT INTO person_course (person_id, course_id)
VALUES ($1, $2)
RETURNING person_id, course_id`,
      [personId, courseId],
    )
    return result.rows[0]
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

function toCourseDto(row: CourseRow): CourseResponseDto {
  return {
    id: row.id,
    organization_id: row.organization_id,
    name: row.name,
    acronym: row.acronym,
    start_at: formatTimestamp(row.start_at),
    end_at: formatTimestamp(row.end_at),
    contract_address: row.contract_address,
  }
}

function postgresError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}
