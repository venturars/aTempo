import type { CourseResponseDto } from '../course/course-response.dto'
import type { PersonResponseDto } from '../person/person-response.dto'
import type { PersonCourseResponseDto } from '../person-course/person-course-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'
import type { OrganizationResponseDto } from '../organization/organization-response.dto'

/** Datos de prueba cuando no hay conexión PostgreSQL configurada. */
export const POSTGRES_MOCK_PERSONS: PersonResponseDto[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    identification_document: 'string',
    email: 'string',
    first_name: 'string',
    last_name: 'string',
    birth_date: '2026-11-18',
    phone: 'string',
  },
]

export const POSTGRES_MOCK_COURSES: CourseResponseDto[] = [
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    organization_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'string',
    acronym: 'string',
    start_at: '2026-09-01T08:00:00.000Z',
    end_at: '2027-06-30T17:00:00.000Z',
    contract_address: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
  },
]

// Organización de ejemplo para probar GET /organization sin PostgreSQL.
export const POSTGRES_MOCK_ORGANIZATIONS: OrganizationResponseDto[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Academia Horizonte',
    tax_id: 'B12345678',
  },
]

export const POSTGRES_MOCK_PERSON_ROLES: PersonRoleResponseDto[] = [
  {
    person_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    role: 'teacher',
  },
]

// La relación de ejemplo permite probar GET /person-course sin PostgreSQL.
export const POSTGRES_MOCK_PERSON_COURSES: PersonCourseResponseDto[] = [
  {
    person_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    course_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  },
]
