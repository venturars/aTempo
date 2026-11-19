import type { CourseResponseDto } from '../course/course-response.dto'
import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'

/** Sustituto local de PostgreSQL cuando no hay `DATABASE_URL` (forma #32). */
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

export const POSTGRES_MOCK_PERSON_ROLES: PersonRoleResponseDto[] = [
  {
    person_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    role: 'teacher',
  },
]