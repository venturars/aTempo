import type { PersonResponseDto } from '../person/person-response.dto'

/** Sustituto local de PostgreSQL cuando no hay `DATABASE_URL` (forma #32 / issue #131). */
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