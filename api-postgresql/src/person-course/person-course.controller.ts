import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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

  @Delete(':personId/:courseId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Se borró la matrícula' })
  @ApiBadRequestResponse({ description: 'personId o courseId no es un UUID' })
  @ApiNotFoundResponse({
    description: 'No existe esa persona en ese curso',
  })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async remove(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<void> {
    let deleted: PersonCourseResponseDto | null

    try {
      deleted = await this.personCourse.delete(personId, courseId)
    } catch {
      throw new ServiceUnavailableException()
    }

    if (deleted === null) {
      throw new NotFoundException()
    }
  }
}
