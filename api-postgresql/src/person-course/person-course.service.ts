import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { PersonCourseResponseDto } from './person-course-response.dto'

@Injectable()
export class PersonCourseService {
  constructor(private readonly postgres: PostgresService) {}

  async list(): Promise<PersonCourseResponseDto[]> {
    return this.postgres.listPersonCourses()
  }

  async delete(
    personId: string,
    courseId: string,
  ): Promise<PersonCourseResponseDto | null> {
    return this.postgres.deletePersonCourse(personId, courseId)
  }
}
