import type { PersonRoleResponseDto } from '../person-role/person-role-response.dto'

/** Sustituto local de PostgreSQL cuando no hay `DATABASE_URL` (forma #32 / issue #138). */
export const POSTGRES_MOCK_PERSON_ROLES: PersonRoleResponseDto[] = [
  {
    person_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    role: 'teacher',
  },
]