import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CourseResponseDto } from './course-response.dto'
import { CourseService } from './course.service'
import { CreateCourseDto } from './create-course.dto'
import { PatchCourseDto } from './patch-course.dto'

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

  @Post()
  @ApiCreatedResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({
    description: 'El cuerpo es inválido o organization_id no es UUID',
  })
  @ApiNotFoundResponse({ description: 'No existe la organización' })
  @ApiConflictResponse({
    description: 'Siglas o dirección de contrato duplicadas',
  })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async create(@Body() body: CreateCourseDto): Promise<CourseResponseDto> {
    try {
      return await this.courseService.create(body)
    } catch (error) {
      const code = postgresErrorCode(error)
      if (code === FOREIGN_KEY_VIOLATION) {
        throw new NotFoundException()
      }
      if (code === UNIQUE_VIOLATION) {
        throw new ConflictException()
      }
      throw new ServiceUnavailableException()
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'No existe un curso con ese id' })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async getCourse(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CourseResponseDto> {
    let course: CourseResponseDto | null

    try {
      course = await this.courseService.findById(id)
    } catch {
      throw new ServiceUnavailableException()
    }

    if (course === null) {
      throw new NotFoundException()
    }

    return course
  }

  @Patch(':id')
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID o el cuerpo es inválido',
  })
  @ApiNotFoundResponse({ description: 'No existe un curso con ese id' })
  @ApiConflictResponse({
    description: 'Siglas o dirección de contrato duplicadas',
  })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async patchCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PatchCourseDto,
  ): Promise<CourseResponseDto> {
    let course: CourseResponseDto | null

    try {
      course = await this.courseService.update(id, body)
    } catch (error) {
      const code = postgresErrorCode(error)
      if (code === UNIQUE_VIOLATION) {
        throw new ConflictException()
      }
      throw new ServiceUnavailableException()
    }

    if (course === null) {
      throw new NotFoundException()
    }

    return course
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'No existe un curso con ese id' })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      const deleted = await this.courseService.remove(id)
      if (!deleted) {
        throw new NotFoundException()
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new ServiceUnavailableException()
    }
  }
}

const FOREIGN_KEY_VIOLATION = '23503'
const UNIQUE_VIOLATION = '23505'

function postgresErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}
