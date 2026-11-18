import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common'
import {
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
}