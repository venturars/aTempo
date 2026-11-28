import type { Course, Person } from './adminStore'

export type PeopleFilters = {
  name: string
  role: '' | 'teacher' | 'student'
  courseId: string
}

export const noPeopleFilters: PeopleFilters = { name: '', role: '', courseId: '' }

// «lucia» encuentra a «Lucía»: se comparan sin mayúsculas ni tildes.
function searchable(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function isInCourse(person: Person, course: Course): boolean {
  return course.teacherId === person.id || course.studentIds.includes(person.id)
}

export function filterPeople(people: Person[], courses: Course[], filters: PeopleFilters): Person[] {
  const name = searchable(filters.name)
  const course = courses.find((entry) => entry.id === filters.courseId)
  return people.filter(
    (person) =>
      (name === '' || searchable(person.name).includes(name)) &&
      (filters.role === '' || person.roles.includes(filters.role)) &&
      (filters.courseId === '' || (course !== undefined && isInCourse(person, course)))
  )
}
