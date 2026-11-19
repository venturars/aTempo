import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { PersonResponseDto } from './person-response.dto'
import { PersonService } from './person.service'

@ApiTags('person')
@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async listPersons(): Promise<PersonResponseDto[]> {
    try {
      return await this.personService.listAll()
    } catch {
      throw new ServiceUnavailableException()
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: PersonResponseDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'No existe una persona con ese id' })
  @ApiServiceUnavailableResponse({ description: 'PostgreSQL no responde' })
  async getPerson(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PersonResponseDto> {
    let person: PersonResponseDto | null

    try {
      person = await this.personService.findById(id)
    } catch {
      throw new ServiceUnavailableException()
    }

    if (person === null) {
      throw new NotFoundException()
    }

    return person
  }
}
