export interface Person {
  id: string
  identification_document: string
  email: string
  first_name: string
  last_name: string
  birth_date: string | null
  phone: string | null
}

export type PersonCreate = Omit<Person, 'id'>

export type PersonUpdate = Person

/** Campos que cambia un modify. Lo que no viene se queda como está. */
export type PersonChanges = Partial<PersonCreate>
