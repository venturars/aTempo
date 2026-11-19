import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CreatePersonCourseDto } from './create-person-course.dto'
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

  @Post()
  @HttpCode(201)
  @ApiCreatedResponse({ type: PersonCourseResponseDto })
  @ApiBadRequestResponse({
    description: 'El cuerpo es inválido o un id no es UUID',
  })
  @ApiNotFoundResponse({
    description: 'No existe la persona o el curso',
  })
  @ApiConflictResponse({
    description: 'Esa persona ya está matriculada en ese curso',
  })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async create(
    @Body() body: CreatePersonCourseDto,
  ): Promise<PersonCourseResponseDto> {
    try {
      return await this.personCourse.create(body.person_id, body.course_id)
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      const code = postgresErrorCode(error)
      if (code === '23503') {
        throw new NotFoundException()
      }
      if (code === '23505') {
        throw new ConflictException()
      }
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

function postgresErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}
