import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { CourseService } from './course.service'
import { CreateCourseDto } from './create-course.dto'
import { CourseResponseDto } from './course-response.dto'

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations/:organizationId/courses')
export class OrganizationCoursesController {
  constructor(private readonly courses: CourseService) {}

  @Post()
  @ApiCreatedResponse({ type: CourseResponseDto })
  create(
    @Param('organizationId') organizationId: string,
    @Body() body: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.courses.create(organizationId, body)
  }
}