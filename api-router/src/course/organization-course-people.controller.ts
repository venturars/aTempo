import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
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
import { PersonResponseDto } from '../person/person-response.dto'
import { CourseService } from './course.service'
import { EnrollPersonDto } from './enroll-person.dto'

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations/:organizationId/courses/:courseId/people')
export class OrganizationCoursePeopleController {
  constructor(private readonly courses: CourseService) {}

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({ description: 'La persona quedó matriculada' })
  enroll(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
    @Body() body: EnrollPersonDto,
  ): Promise<void> {
    return this.courses.enroll(organizationId, courseId, body)
  }

  @Get()
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  list(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
  ): Promise<PersonResponseDto[]> {
    return this.courses.listPeople(organizationId, courseId)
  }

  @Delete(':personId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Matrícula eliminada' })
  unenroll(
    @Param('organizationId') organizationId: string,
    @Param('courseId') courseId: string,
    @Param('personId') personId: string,
  ): Promise<void> {
    return this.courses.unenroll(organizationId, courseId, personId)
  }
}