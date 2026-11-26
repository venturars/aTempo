import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Sdk } from 'atempo-sdk'
import { ATEMPO_SDK } from '../auth/atempo-sdk.token'
import { unwrapSdk } from '../contract/map-app-error'
import { BearerGuard } from '../shared/bearer.guard'
import { CreateOrganizationDto } from './create-organization.dto'
import { InvitePersonDto } from './invite-person.dto'
import {
  CreateOrganizationResponseDto,
  OrganizationResponseDto,
  PersonResponseDto,
  toOrganizationJson,
  toPersonJson,
} from './organization-response.dto'
import { PatchOrganizationDto } from './patch-organization.dto'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  @Post()
  @ApiCreatedResponse({ type: CreateOrganizationResponseDto })
  async create(
    @Body() body: CreateOrganizationDto,
  ): Promise<CreateOrganizationResponseDto> {
    const value = unwrapSdk(
      await this.sdk.createOrganization({
        name: body.name,
        taxId: body.tax_id,
        firstName: body.first_name,
        lastName: body.last_name,
        identificationDocument: body.identification_document,
        email: body.email,
        birthDate: body.birth_date,
        phone: body.phone,
      }),
    )
    return {
      organization: toOrganizationJson(value.organization),
      person: toPersonJson(value.person),
    }
  }

  @Get(':organizationId')
  @ApiOkResponse({ type: OrganizationResponseDto })
  async get(
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationResponseDto> {
    return toOrganizationJson(
      unwrapSdk(await this.sdk.getOrganization({ organizationId })),
    )
  }

  @Patch(':organizationId')
  @ApiOkResponse({ type: OrganizationResponseDto })
  async patch(
    @Param('organizationId') organizationId: string,
    @Body() body: PatchOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return toOrganizationJson(
      unwrapSdk(
        await this.sdk.patchOrganization({
          organizationId,
          name: body.name,
          taxId: body.tax_id,
        }),
      ),
    )
  }

  @Post(':organizationId/people')
  @ApiCreatedResponse({ type: PersonResponseDto })
  async invite(
    @Param('organizationId') organizationId: string,
    @Body() body: InvitePersonDto,
  ): Promise<PersonResponseDto> {
    return toPersonJson(
      unwrapSdk(
        await this.sdk.invitePerson({
          organizationId,
          firstName: body.first_name,
          lastName: body.last_name,
          identificationDocument: body.identification_document,
          email: body.email,
          birthDate: body.birth_date,
          phone: body.phone,
          role: body.role,
        }),
      ),
    )
  }

  @Get(':organizationId/people')
  @ApiOkResponse({ type: PersonResponseDto, isArray: true })
  async list(
    @Param('organizationId') organizationId: string,
  ): Promise<PersonResponseDto[]> {
    return unwrapSdk(await this.sdk.listPeople({ organizationId })).map(
      toPersonJson,
    )
  }
}
