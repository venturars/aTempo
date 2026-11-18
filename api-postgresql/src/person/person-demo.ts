import { PersonResponseDto } from './person-response.dto'

/** Datos de prueba fijos (#131). No salen de PostgreSQL en este paso. */
export const PERSON_DEMO: PersonResponseDto[] = [
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