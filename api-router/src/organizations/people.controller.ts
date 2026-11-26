import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import type { Sdk } from 'atempo-sdk'
import { ATEMPO_SDK } from '../auth/atempo-sdk.token'
import { unwrapSdk } from '../contract/map-app-error'
import { BearerGuard } from '../shared/bearer.guard'
import { PersonResponseDto, toPersonJson } from './organization-response.dto'
import { PatchPersonDto } from './patch-person.dto'

@ApiTags('people')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('people')
export class PeopleController {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  @Get(':personId')
  @ApiOkResponse({ type: PersonResponseDto })
  async get(@Param('personId') personId: string): Promise<PersonResponseDto> {
    return toPersonJson(unwrapSdk(await this.sdk.getPerson({ personId })))
  }

  @Patch(':personId')
  @ApiOkResponse({ type: PersonResponseDto })
  async patch(
    @Param('personId') personId: string,
    @Body() body: PatchPersonDto,
  ): Promise<PersonResponseDto> {
    return toPersonJson(
      unwrapSdk(
        await this.sdk.patchPerson({
          personId,
          firstName: body.first_name,
          lastName: body.last_name,
          identificationDocument: body.identification_document,
          email: body.email,
          birthDate: body.birth_date,
          phone: body.phone,
          roles: body.roles,
        }),
      ),
    )
  }

  @Delete(':personId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('personId') personId: string): Promise<void> {
    unwrapSdk(await this.sdk.deletePerson({ personId }))
  }
}
