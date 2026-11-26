import { Module } from '@nestjs/common'
import { OrganizationDashboardController } from './organization-dashboard.controller'

@Module({
  controllers: [OrganizationDashboardController],
})
export class OrganizationDashboardModule {}