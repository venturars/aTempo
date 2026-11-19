import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { CourseResponseDto } from './course-response.dto'

@Injectable()
export class CourseService {
  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<CourseResponseDto[]> {
    return this.postgres.listCourses()
  }
}
