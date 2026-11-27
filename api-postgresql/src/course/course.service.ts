import { Injectable } from '@nestjs/common'
import { PostgresService } from '../postgres/postgres.service'
import { CourseResponseDto } from './course-response.dto'
import { CreateCourseDto } from './create-course.dto'
import { PatchCourseDto } from './patch-course.dto'

@Injectable()
export class CourseService {
  constructor(private readonly postgres: PostgresService) {}

  async listAll(): Promise<CourseResponseDto[]> {
    return this.postgres.listCourses()
  }

  async findById(id: string): Promise<CourseResponseDto | null> {
    return this.postgres.findCourseById(id)
  }

  async create(body: CreateCourseDto): Promise<CourseResponseDto> {
    return this.postgres.insertCourse({
      organization_id: body.organization_id,
      name: body.name,
      acronym: body.acronym,
      start_at: body.start_at,
      end_at: body.end_at,
      contract_address: body.contract_address,
    })
  }

  async update(
    id: string,
    body: PatchCourseDto,
  ): Promise<CourseResponseDto | null> {
    return this.postgres.updateCourse(id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.acronym !== undefined ? { acronym: body.acronym } : {}),
      ...(body.start_at !== undefined ? { start_at: body.start_at } : {}),
      ...(body.end_at !== undefined ? { end_at: body.end_at } : {}),
      ...(body.contract_address !== undefined
        ? { contract_address: body.contract_address }
        : {}),
    })
  }

  async remove(id: string): Promise<boolean> {
    return this.postgres.deleteCourse(id)
  }
}
