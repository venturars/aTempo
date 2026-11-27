import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { CourseService } from './course.service'
import { CreateCourseDto } from './create-course.dto'
import { CourseResponseDto } from './course-response.dto'
import { PatchCourseDto } from './patch-course.dto'

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

  @Get()
  @ApiOkResponse({ type: CourseResponseDto, isArray: true })
  list(
    @Param('organizationId') organizationId: string,
  ): Promise<CourseResponseDto[]> {
    return this.courses.list(organizationId)
  }

  @Get(':courseId')
  @ApiOkResponse({ type: CourseResponseDto })
  get(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
  ): Promise<CourseResponseDto> {
    return this.courses.get(organizationId, courseId)
  }

  @Patch(':courseId')
  @ApiOkResponse({ type: CourseResponseDto })
  patch(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
    @Body() body: PatchCourseDto,
  ): Promise<CourseResponseDto> {
    return this.courses.patch(organizationId, courseId, body)
  }

  @Delete(':courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
  ): Promise<void> {
    return this.courses.remove(organizationId, courseId)
  }
}
