import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { PatchPersonDto } from './patch-person.dto'
import { PersonResponseDto } from './person-response.dto'
import { PersonService } from './person.service'

@ApiTags('people')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('people')
export class PersonController {
  constructor(private readonly people: PersonService) {}

  @Get(':personId')
  @ApiOkResponse({ type: PersonResponseDto })
  get(@Param('personId') personId: string): Promise<PersonResponseDto> {
    return this.people.get(personId)
  }

  @Patch(':personId')
  @ApiOkResponse({ type: PersonResponseDto })
  patch(
    @Param('personId') personId: string,
    @Body() body: PatchPersonDto,
  ): Promise<PersonResponseDto> {
    return this.people.patch(personId, body)
  }

  @Delete(':personId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('personId') personId: string): Promise<void> {
    return this.people.remove(personId)
  }
}
