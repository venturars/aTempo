import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { BearerGuard } from '../shared/bearer.guard'
import { CreateOrganizationDto } from './create-organization.dto'
import {
  CreateOrganizationResponseDto,
  OrganizationResponseDto,
} from './organization-response.dto'
import { OrganizationService } from './organization.service'
import { PatchOrganizationDto } from './patch-organization.dto'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  @ApiCreatedResponse({ type: CreateOrganizationResponseDto })
  create(@Body() body: CreateOrganizationDto): Promise<CreateOrganizationResponseDto> {
    return this.organizations.create(body)
  }

  @Get(':organizationId')
  @ApiOkResponse({ type: OrganizationResponseDto })
  get(@Param('organizationId') organizationId: string): Promise<OrganizationResponseDto> {
    return this.organizations.get(organizationId)
  }

  @Patch(':organizationId')
  @ApiOkResponse({ type: OrganizationResponseDto })
  patch(
    @Param('organizationId') organizationId: string,
    @Body() body: PatchOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.patch(organizationId, body)
  }
}
