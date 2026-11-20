import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CourseResponseDto } from './course-response.dto'
import { CourseService } from './course.service'

@ApiTags('course')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @ApiOkResponse({ type: CourseResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async listCourses(): Promise<CourseResponseDto[]> {
    try {
      return await this.courseService.listAll()
    } catch {
      throw new ServiceUnavailableException()
    }
  }
}
