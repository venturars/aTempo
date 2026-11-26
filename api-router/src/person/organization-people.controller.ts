import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { InvitePersonDto } from './invite-person.dto'
import { PersonResponseDto } from './person-response.dto'
import { PersonService } from './person.service'

@ApiTags('people')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations/:organizationId/people')
export class OrganizationPeopleController {
  constructor(private readonly people: PersonService) {}

  @Post()
  @ApiCreatedResponse({ type: PersonResponseDto })
  invite(
    @Param('organizationId') organizationId: string,
    @Body() body: InvitePersonDto,
  ): Promise<PersonResponseDto> {
    return this.people.invite(organizationId, body)
  }

  @Get()
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  list(
    @Param('organizationId') organizationId: string,
  ): Promise<PersonResponseDto[]> {
    return this.people.list(organizationId)
  }
}
