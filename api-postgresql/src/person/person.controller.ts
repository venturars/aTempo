import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { PersonResponseDto } from './person-response.dto'
import { PersonService } from './person.service'

@ApiTags('person')
@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get()
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  listPersons(): PersonResponseDto[] {
    return this.personService.listAll()
  }
}