import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { CourseStudentDto } from './dto'
import { MockApiService } from './mock-api.service'

@ApiTags('courses (mock)')
@Controller('courses')
export class CoursesController {
  constructor(private readonly mockApi: MockApiService) {}

  @Get(':courseId/students')
  @ApiOkResponse({ type: CourseStudentDto, isArray: true })
  listCourseStudents(@Param('courseId') courseId: string): CourseStudentDto[] {
    return this.mockApi.listCourseStudents(courseId)
  }
}
