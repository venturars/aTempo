import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { BearerGuard } from './bearer.guard'
import { CourseStudentDto } from './dto'
import { MockApiService } from './mock-api.service'

@ApiTags('courses (mock)')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly mockApi: MockApiService) {}

  @Get(':courseId/students')
  @ApiOkResponse({ type: CourseStudentDto, isArray: true })
  listCourseStudents(@Param('courseId') courseId: string): CourseStudentDto[] {
    return this.mockApi.listCourseStudents(courseId)
  }
}
