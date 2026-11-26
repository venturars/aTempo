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
