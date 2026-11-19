// Organizaciones de ejemplo para la pantalla de prueba.
// Los campos son los mismos que devuelve GET /organization en api-postgresql.
export type Organization = {
  id: string
  name: string
  tax_id: string
}

export const organizationListExample: Organization[] = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Academia Horizonte',
    tax_id: 'B12345678'
  },
  {
    id: '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3b4a59',
    name: 'Colegio Río Claro',
    tax_id: 'G87654321'
  },
  {
    id: 'e4c1a8f2-6b7d-4c3e-9f10-5a2b8d7e6c31',
    name: 'Escuela de Música Allegro',
    tax_id: 'B23456789'
  }
]
