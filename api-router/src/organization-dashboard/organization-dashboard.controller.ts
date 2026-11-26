import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger'
import type { DashboardFixture, Sdk } from 'atempo-sdk'
import { ATEMPO_SDK } from '../auth/atempo-sdk.token'
import { unwrapSdk } from '../contract/map-app-error'
import { BearerGuard } from '../shared/bearer.guard'

@ApiTags('organization')
@ApiBearerAuth()
@UseGuards(BearerGuard)
@Controller('organization')
export class OrganizationDashboardController {
  constructor(@Inject(ATEMPO_SDK) private readonly sdk: Sdk) {}

  @Get('dashboard')
  @ApiQuery({
    name: 'fixture',
    required: false,
    enum: ['complete', 'empty', 'incomplete'],
  })
  @ApiOkResponse({ description: 'OrganizationDashboard JSON' })
  async get(@Query('fixture') fixture?: string) {
    const selected = (fixture ?? 'complete') as DashboardFixture
    return unwrapSdk(await this.sdk.getOrganizationDashboard({ fixture: selected }))
  }
}