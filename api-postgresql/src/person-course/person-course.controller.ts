import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { PersonCourseResponseDto } from './person-course-response.dto'
import { PersonCourseService } from './person-course.service'

@ApiTags('person-course')
@Controller('person-course')
export class PersonCourseController {
  constructor(private readonly personCourse: PersonCourseService) {}

  @Get()
  @ApiOkResponse({ type: PersonCourseResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async list(): Promise<PersonCourseResponseDto[]> {
    try {
      return await this.personCourse.list()
    } catch {
      throw new ServiceUnavailableException()
    }
  }
}
