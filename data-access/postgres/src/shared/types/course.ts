export interface Course {
  id: string
  organization_id: string
  name: string
  acronym: string
  start_at: string
  end_at: string
  contract_address: string
}

export type CourseCreate = Omit<Course, 'id'>

export type CourseUpdate = Course

/** Campos que cambia un modify. Lo que no viene se queda como está. */
export type CourseChanges = Partial<CourseCreate>
