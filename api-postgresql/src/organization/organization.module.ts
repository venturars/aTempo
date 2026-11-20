import { Module } from '@nestjs/common'
import { PostgresModule } from '../postgres/postgres.module'
import { OrganizationController } from './organization.controller'
import { OrganizationService } from './organization.service'

@Module({
  imports: [PostgresModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
