import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { PersonResponseDto } from '../person/person-response.dto'
import { CourseService } from './course.service'

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations/:organizationId/courses/:courseId/students')
export class OrganizationCourseStudentsController {
  constructor(private readonly courses: CourseService) {}

  @Get()
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  list(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
  ): Promise<PersonResponseDto[]> {
    return this.courses.listStudents(organizationId, courseId)
  }
}
